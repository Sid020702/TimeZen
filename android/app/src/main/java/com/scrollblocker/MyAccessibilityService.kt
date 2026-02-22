package com.scrollblocker

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.view.accessibility.AccessibilityEvent
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import android.util.Log


class MyAccessibilityService : AccessibilityService() {

    private val gson = Gson()

    private var targetApps: MutableMap<String, Long> = mutableMapOf()

    private val updateReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            reloadTargetApps()

            Log.d(
                "Intent Received",
                "$intent"
            )
            val currentPkg = rootInActiveWindow?.packageName?.toString()
            currentPkg?.let { enforceBlockedApps(it) }
        }
    }


    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(
            "ScrollBlocker",
            "onServiceConnected Started",
        )

        reloadTargetApps()

        val filter = IntentFilter().apply {
            addAction("com.scrollblocker.TARGET_APPS_UPDATED")
            addAction("com.scrollblocker.RESTORE_LIMITS")
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(updateReceiver, filter)
        }

        Log.d(
            "ScrollBlocker",
            "onServiceConnected Success",
        )
    }

    override fun onDestroy() {
        unregisterReceiver(updateReceiver)
        super.onDestroy()
    }


    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        Log.d(
            "ScrollBlocker",
            "onAccessibilityEvent -> eventType  = $event?.eventType"
        )
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        enforceBlockedApps(packageName)
    }

    override fun onInterrupt() {
        // No-op
    }

    /* ===================== CORE LOGIC ===================== */

    private fun reloadTargetApps() {
        val prefs = getSharedPreferences(
            AccessibilityModule.PREF_FILE_KEY,
            Context.MODE_PRIVATE
        )

        val json = prefs.getString(AccessibilityModule.KEY_TARGET_APPS, "{}") ?: "{}"
        val type = object : TypeToken<MutableMap<String, Long>>() {}.type

        targetApps = gson.fromJson(json, type) ?: mutableMapOf()
    }

    private fun enforceBlockedApps(packageName: String) {
        Log.d(
            "ScrollBlocker",
            "enforceBlockedApps() → currentPkg=$packageName, targetApps=$targetApps"
        )
        if (targetApps.containsKey(packageName)) {
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }
}
