package com.idleflowgames.playgames

import com.getcapacitor.PluginCall
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.games.PlayGames

internal class SignInModule(plugin: PlayGamesPlugin) : PgsModule(plugin) {
    private val signInClient get() = PlayGames.getGamesSignInClient(activity)
    private val playersClient get() = PlayGames.getPlayersClient(activity)

    fun signIn(call: PluginCall) {
        val silent = call.getBoolean("silent", true) ?: true
        // Interactive sign-in can crash uncatchably inside GMS's
        // GamesResolutionActivity on devices with a broken Play Services install
        // (some custom ROMs). Pre-flight the availability check and bail to
        // signed-out rather than launch the activity. Silent auth shows no UI.
        if (!silent) {
            val gmsStatus = GoogleApiAvailability.getInstance()
                .isGooglePlayServicesAvailable(activity)
            if (gmsStatus != ConnectionResult.SUCCESS) {
                resolveSignedOut(call, "unavailable")
                return
            }
        }
        val deadline = if (silent) ReadDeadline(SILENT_AUTH_TIMEOUT_MS) {
            call.reject("silent sign-in timed out", "PGS_AUTH_TIMEOUT")
        } else null
        try {
            val task = if (silent) signInClient.isAuthenticated else signInClient.signIn()
            task.addOnCompleteListener { auth ->
                if (deadline?.isAnswered == true) return@addOnCompleteListener
                try {
                    when {
                        auth.isCanceled || (auth.exception as? ApiException)?.statusCode == CommonStatusCodes.CANCELED ->
                            answer(deadline) { resolveSignedOut(call, "cancelled") }
                        !auth.isSuccessful -> answer(deadline) { call.rejectFromTask(auth, "sign-in failed") }
                        auth.result?.isAuthenticated == true -> resolveWithPlayer(call, deadline)
                        else -> answer(deadline) { resolveSignedOut(call, "not_authenticated") }
                    }
                } catch (error: Exception) {
                    answer(deadline) { call.rejectFromException(error, "sign-in failed") }
                }
            }
        } catch (error: Exception) {
            answer(deadline) { call.rejectFromException(error, "sign-in failed") }
        }
    }

    fun isSignedIn(call: PluginCall) {
        signInClient.isAuthenticated.bind(call, "auth check failed") { result ->
            jsObject { put("signedIn", result.isAuthenticated) }
        }
    }

    fun requestServerSideAccess(call: PluginCall) {
        val serverClientId = call.getString("serverClientId")
        if (serverClientId.isNullOrEmpty()) {
            call.reject("serverClientId is required")
            return
        }
        val forceRefresh = call.getBoolean("forceRefresh", false) ?: false
        signInClient.requestServerSideAccess(serverClientId, forceRefresh)
            .bind(call, "server-side access failed") { authCode ->
                jsObject { put("authCode", authCode) }
            }
    }

    fun getPlayer(call: PluginCall) {
        playersClient.currentPlayer.bind(call, "player lookup failed") { player ->
            player.toJsObject()
        }
    }

    private fun resolveWithPlayer(call: PluginCall, deadline: ReadDeadline?) {
        playersClient.currentPlayer.addOnCompleteListener { task ->
            // Signed in but profile lookup failed: report signed-in, no profile.
            val player = task.takeIf { it.isSuccessful }
                ?.let { runCatching { it.result?.toJsObject() }.getOrNull() }
            val body = jsObject {
                put("signedIn", true)
                if (player != null) put("player", player)
            }
            answer(deadline) { emitAndResolve(call, body) }
        }
    }

    private fun resolveSignedOut(call: PluginCall, reason: String) {
        emitAndResolve(call, jsObject {
            put("signedIn", false)
            put("reason", reason)
        })
    }

    private fun emitAndResolve(call: PluginCall, body: com.getcapacitor.JSObject) {
        plugin.emit("signInStateChanged", body)
        call.resolve(body)
    }

    private companion object {
        const val SILENT_AUTH_TIMEOUT_MS = 30_000L
    }
}

private fun answer(deadline: ReadDeadline?, action: () -> Unit) {
    if (deadline == null) action() else deadline.finish(action)
}
