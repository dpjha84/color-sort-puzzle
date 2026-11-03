package com.idleflowgames.playgames

import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/** Read-only deadline. A timed-out native operation may still finish and need cleanup. */
internal class ReadDeadline(timeoutMs: Long, onTimeout: () -> Unit) {
    private val answered = AtomicBoolean(false)
    private val timer = TIMER.schedule({
        if (answered.compareAndSet(false, true)) onTimeout()
    }, timeoutMs, TimeUnit.MILLISECONDS)

    val isAnswered: Boolean get() = answered.get()

    fun finish(answer: () -> Unit): Boolean {
        if (!answered.compareAndSet(false, true)) return false
        timer.cancel(false)
        answer()
        return true
    }

    private companion object {
        val TIMER = Executors.newSingleThreadScheduledExecutor { task ->
            Thread(task, "pgs-read-deadlines").apply { isDaemon = true }
        }
    }
}
