package com.idleflowgames.playgames

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.games.GamesClientStatusCodes
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.SnapshotsClient
import com.google.android.gms.games.snapshot.Snapshot
import com.google.android.gms.games.snapshot.SnapshotMetadata
import com.google.android.gms.games.snapshot.SnapshotMetadataChange
import com.google.android.gms.tasks.Task
import java.nio.charset.StandardCharsets
import java.util.concurrent.CancellationException
import java.util.concurrent.Executor
import java.util.concurrent.Executors

/** PGS Saved Games (Snapshots). Conflicts resolve most-recently-modified-wins (no merge). */
internal class SavedGamesModule(plugin: PlayGamesPlugin) : PgsModule(plugin) {
    private val client get() = PlayGames.getSnapshotsClient(activity)
    private val playersClient get() = PlayGames.getPlayersClient(activity)

    fun load(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("missing name")
        val deadline = readDeadline(call, "snapshot load")
        try {
            val loadingClient = client
            // Reads never create a slot. Blocking snapshot I/O runs off the main thread.
            loadingClient.open(name, /* createIfNotFound = */ false, AUTO_RESOLVE)
                .addOnCompleteListener(IO_EXECUTOR) { task ->
                    try {
                        if (deadline.isAnswered) {
                            if (task.isSuccessful) {
                                val result = task.result
                                if (result.isConflict) loadingClient.discardConflict(result.conflict)
                                else result.data?.let { loadingClient.discardAndClose(it) }
                            }
                        } else {
                            val snapshot = readOpened(loadingClient, task)
                            deadline.finish { call.resolve(jsObject { put("snapshot", snapshot) }) }
                        }
                    } catch (e: Exception) {
                        deadline.finish { call.rejectFromException(e, "snapshot load failed") }
                    }
                }
        } catch (e: Exception) {
            deadline.finish { call.rejectFromException(e, "snapshot load failed") }
        }
    }

    private fun readOpened(
        openingClient: SnapshotsClient,
        task: Task<SnapshotsClient.DataOrConflict<Snapshot>>,
    ): Any {
        if (!task.isSuccessful) {
            val e = task.exception
            if ((e as? ApiException)?.statusCode == GamesClientStatusCodes.SNAPSHOT_NOT_FOUND) {
                return JSObject.NULL
            }
            throw e ?: CancellationException("snapshot load cancelled")
        }
        val result = task.result
        if (result.isConflict) {
            openingClient.discardConflict(result.conflict)
            throw IllegalStateException("snapshot conflict was not resolved")
        }
        val snap = result.data ?: return JSObject.NULL
        try {
            val bytes = checkNotNull(snap.snapshotContents.readFully()) {
                "snapshot contents unreadable"
            }
            return jsObject {
                put("name", snap.metadata.uniqueName)
                put("description", snap.metadata.description ?: "")
                put("modifiedAt", snap.metadata.lastModifiedTimestamp)
                put("data", String(bytes, StandardCharsets.UTF_8))
            }
        } finally {
            runCatching { openingClient.discardAndClose(snap) }
        }
    }

    fun save(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("missing name")
        val data = call.getString("data") ?: return call.reject("missing data")
        val description = call.getString("description") ?: ""
        val expectedPlayerId = call.getString("expectedPlayerId")
        if (expectedPlayerId.isNullOrBlank()) {
            call.reject("expectedPlayerId is required")
            return
        }

        // Check the native identity before selecting a snapshot client. The JS
        // sign-in event can arrive after Play Games has already switched users.
        playersClient.currentPlayer
            .continueWithTask(IO_EXECUTOR) { task ->
                requireExpectedPlayer(task.result?.playerId, expectedPlayerId)
                val openingClient = client
                openingClient.open(name, /* createIfNotFound = */ true, AUTO_RESOLVE)
                    .continueWith(IO_EXECUTOR) { openTask ->
                        val result = openTask.result
                        if (result.isConflict) {
                            openingClient.discardConflict(result.conflict)
                            throw IllegalStateException("snapshot conflict was not resolved")
                        }
                        val snapshot = result.data
                            ?: throw IllegalStateException("snapshot unavailable")
                        OpenedSnapshot(openingClient, snapshot)
                    }
            }
            .continueWithTask(IO_EXECUTOR) { task ->
                val opened = task.result
                    ?: throw IllegalStateException("snapshot unavailable")
                playersClient.currentPlayer.continueWithTask(IO_EXECUTOR) { playerTask ->
                    try {
                        // Do not touch the opened snapshot until its owner has
                        // been re-validated immediately before the write.
                        requireExpectedPlayer(playerTask.result?.playerId, expectedPlayerId)
                        check(opened.snapshot.snapshotContents.writeBytes(
                            data.toByteArray(StandardCharsets.UTF_8),
                        )) { "snapshot write failed" }
                        val change = SnapshotMetadataChange.Builder()
                            .setDescription(description)
                            .build()
                        opened.client.commitAndClose(opened.snapshot, change)
                    } catch (error: Exception) {
                        runCatching { opened.client.discardAndClose(opened.snapshot) }
                        throw error
                    }
                }
            }
            .bind(call, "snapshot save failed")
    }

    fun list(call: PluginCall) {
        // A cached empty list is not proof that a returning player's remote slot
        // is absent. Force the server read so offline/auth failures reject and JS
        // keeps publication quarantined instead of creating over an unseen head.
        val deadline = readDeadline(call, "snapshot list")
        try {
            client.load(/* forceReload = */ true).addOnCompleteListener { task ->
                try {
                    if (!task.isSuccessful) {
                        deadline.finish { call.rejectFromTask(task, "snapshot list failed") }
                    } else {
                        val arr = JSArray()
                        // Even a late result owns a buffer which must be released.
                        checkNotNull(task.result.get()) { "snapshot metadata unavailable" }.use { buf ->
                            if (!deadline.isAnswered) {
                                for (i in 0 until buf.count) arr.put(buf.get(i).toJsObject())
                            }
                        }
                        deadline.finish { call.resolve(jsObject { put("snapshots", arr) }) }
                    }
                } catch (e: Exception) {
                    deadline.finish { call.rejectFromException(e, "snapshot list failed") }
                }
            }
        } catch (e: Exception) {
            deadline.finish { call.rejectFromException(e, "snapshot list failed") }
        }
    }

    fun delete(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("missing name")
        client.load(false)
            .continueWithTask { task ->
                val meta = task.result?.get()?.use { buf ->
                    buf.firstOrNull { it.uniqueName == name }?.freeze()
                } ?: throw NoSuchElementException("snapshot '$name' not found")
                client.delete(meta)
            }
            .bind(call, "snapshot delete failed")
    }

    private companion object {
        const val AUTO_RESOLVE = SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED

        // Serial daemon thread for snapshot file I/O.
        val IO_EXECUTOR: Executor = Executors.newSingleThreadExecutor { r ->
            Thread(r, "pgs-saved-games").apply { isDaemon = true }
        }
    }
}

private const val READ_TIMEOUT_MS = 30_000L

private fun readDeadline(call: PluginCall, operation: String) =
    ReadDeadline(READ_TIMEOUT_MS) { call.reject("$operation timed out", "PGS_READ_TIMEOUT") }

private data class OpenedSnapshot(
    val client: SnapshotsClient,
    val snapshot: Snapshot,
)

private fun SnapshotsClient.discardConflict(conflict: SnapshotsClient.SnapshotConflict?) {
    if (conflict == null) return
    runCatching { discardAndClose(conflict.snapshot) }
    runCatching { discardAndClose(conflict.conflictingSnapshot) }
}

private fun requireExpectedPlayer(actualPlayerId: String?, expectedPlayerId: String) {
    if (actualPlayerId != expectedPlayerId) {
        throw SecurityException("Play Games player changed before snapshot write")
    }
}

private fun SnapshotMetadata.toJsObject(): JSObject = jsObject {
    put("name", uniqueName)
    put("description", description ?: "")
    put("modifiedAt", lastModifiedTimestamp)
}

/** SnapshotMetadataBuffer has release() but isn't Closeable; provide a use {} of our own. */
private inline fun <R> com.google.android.gms.games.snapshot.SnapshotMetadataBuffer.use(
    block: (com.google.android.gms.games.snapshot.SnapshotMetadataBuffer) -> R,
): R {
    try {
        return block(this)
    } finally {
        release()
    }
}

private fun com.google.android.gms.games.snapshot.SnapshotMetadataBuffer.firstOrNull(
    predicate: (SnapshotMetadata) -> Boolean,
): SnapshotMetadata? {
    for (i in 0 until count) {
        val m = get(i)
        if (predicate(m)) return m
    }
    return null
}
