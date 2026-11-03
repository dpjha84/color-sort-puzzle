package com.idleflowgames.playgames

import androidx.appcompat.app.AppCompatActivity
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.games.Player
import com.google.android.gms.tasks.OnCompleteListener
import com.google.android.gms.tasks.Task
import java.util.concurrent.Executor

/** Shared base for the per-feature modules; carries the plugin back-reference. */
internal abstract class PgsModule(protected val plugin: PlayGamesPlugin) {
    protected val activity: AppCompatActivity
        get() = plugin.activity
}

/** Build a JSObject with a fluent block — `jsObject { put("k", v) }`. */
internal inline fun jsObject(builder: JSObject.() -> Unit): JSObject =
    JSObject().apply(builder)

/** Reject a PluginCall, exposing a GMS ApiException statusCode as the Capacitor error code. */
internal fun PluginCall.rejectFromException(e: Exception, fallbackMsg: String) {
    val message = e.message ?: fallbackMsg
    val status = (e as? ApiException)?.statusCode
    if (status != null) reject(message, status.toString(), e) else reject(message, e)
}

/** Reject a PluginCall from a Task that failed or was cancelled. */
internal fun PluginCall.rejectFromTask(task: Task<*>, fallbackMsg: String) {
    val e = task.exception
    if (e != null) rejectFromException(e, fallbackMsg) else reject("$fallbackMsg: cancelled")
}

/**
 * Run [onSuccess] once the task succeeds. Failure, cancellation, or a throw from
 * [onSuccess] rejects [call], so no outcome leaves the JS promise unanswered.
 */
internal inline fun <T> Task<T>.settle(
    call: PluginCall,
    errorMsg: String,
    executor: Executor? = null,
    crossinline onSuccess: (T) -> Unit,
) {
    val listener = OnCompleteListener<T> { task ->
        try {
            if (task.isSuccessful) onSuccess(task.result) else call.rejectFromTask(task, errorMsg)
        } catch (e: Exception) {
            call.rejectFromException(e, errorMsg)
        }
    }
    if (executor == null) {
        addOnCompleteListener(listener)
    } else {
        addOnCompleteListener(executor, listener)
    }
}

/** Resolve a void-yielding Task to a PluginCall (success resolves, anything else rejects). */
internal fun <T> Task<T>.bind(call: PluginCall, errorMsg: String = "operation failed") =
    settle(call, errorMsg) { call.resolve() }

/** Resolve a value-yielding Task to a PluginCall, mapping the result to a JSObject. */
internal inline fun <T> Task<T>.bind(
    call: PluginCall,
    errorMsg: String = "operation failed",
    crossinline transform: (T) -> JSObject,
) = settle(call, errorMsg) { result -> call.resolve(transform(result)) }

/** Serialise a PGS Player as the JS-side `PlayerInfo` shape. */
internal fun Player.toJsObject(): JSObject = jsObject {
    put("playerId", playerId)
    put("displayName", displayName ?: "")
    iconImageUri?.toString()?.let { put("avatarUrl", it) }
}
