package com.scrollblocker

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import androidx.work.*
import com.facebook.react.bridge.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.concurrent.TimeUnit

class AccessibilityModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val gson = Gson()

    override fun getName(): String = "AccessibilityModule"

    companion object {
        const val PREF_FILE_KEY = "com.scrollblocker.PREFERENCE_FILE_KEY"
        const val KEY_TARGET_APPS = "target_apps"
        const val KEY_PAUSED_APPS = "paused_target_apps"
        const val ACTION_TARGET_APPS_UPDATED = "com.scrollblocker.TARGET_APPS_UPDATED"
        const val ACTION_RESTORE_LIMITS =  "com.scrollblocker.RESTORE_LIMITS"
        const val EXTRA_TARGET_APPS_JSON = "target_apps_json"

        private const val CLEANUP_WORK_NAME = "cleanup_worker_chain"
        private const val RESTORE_WORK_NAME = "restore_limits_worker"

        fun cleanupExpiredApps(context: Context) {
            val prefs = context.getSharedPreferences(PREF_FILE_KEY, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_TARGET_APPS, "{}") ?: "{}"

            val type = object : TypeToken<MutableMap<String, Long>>() {}.type
            val map: MutableMap<String, Long> =
                Gson().fromJson(json, type) ?: mutableMapOf()

            val now = System.currentTimeMillis()
            val originalSize = map.size

            map.entries.removeIf { it.value <= now }

            if (map.size != originalSize) {
                prefs.edit()
                    .putString(KEY_TARGET_APPS, Gson().toJson(map))
                    .apply()

                val intent = Intent(ACTION_TARGET_APPS_UPDATED)
                intent.setPackage(context.packageName)
                context.sendBroadcast(intent)
            }
        }

        fun scheduleCleanupWorker(context: Context) {
            val work = OneTimeWorkRequestBuilder<CleanupWorker>()
                .setInitialDelay(1, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                CLEANUP_WORK_NAME,
                ExistingWorkPolicy.KEEP,
                work
            )
        }
    }

    /* ======================= RN METHODS ======================= */

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val service =
                "${context.packageName}/${MyAccessibilityService::class.java.name}"

            val enabled = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )?.contains(service) ?: false

            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_CHECK_FAILED", e)
        }
    }

    @ReactMethod
    fun setTargetApps(apps: ReadableMap, promise: Promise) {
        try {
            val prefs =
                reactApplicationContext.getSharedPreferences(PREF_FILE_KEY, Context.MODE_PRIVATE)

            val now = System.currentTimeMillis()
            val map = mutableMapOf<String, Long>()

            val iterator = apps.keySetIterator()
            while (iterator.hasNextKey()) {
                val pkg = iterator.nextKey()
                val minutes = apps.getInt(pkg)
                map[pkg] = now + minutes * 60_000L
            }

            prefs.edit()
                .putString(KEY_TARGET_APPS, gson.toJson(map))
                .apply()

            val intent = Intent(ACTION_TARGET_APPS_UPDATED)
            intent.setPackage(reactApplicationContext.packageName)
            reactApplicationContext.sendBroadcast(intent)

            scheduleCleanupWorker(reactApplicationContext)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_TARGET_APPS_FAILED", e)
        }
    }

    @ReactMethod
    fun getTargetApps(promise: Promise) {
        try {
            cleanupExpiredApps(reactApplicationContext)

            val prefs =
                reactApplicationContext.getSharedPreferences(PREF_FILE_KEY, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_TARGET_APPS, "{}") ?: "{}"

            val type = object : TypeToken<Map<String, Long>>() {}.type
            val map: Map<String, Long> = gson.fromJson(json, type)

            val result = Arguments.createMap()
            map.forEach { (pkg, expiry) ->
                result.putDouble(pkg, expiry.toDouble())
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_TARGET_APPS_FAILED", e)
        }
    }

    @ReactMethod
    fun pauseTargetApps(durationSeconds: Int, promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs =
                context.getSharedPreferences(PREF_FILE_KEY, Context.MODE_PRIVATE)

            WorkManager.getInstance(context)
                .cancelUniqueWork(CLEANUP_WORK_NAME)

            WorkManager.getInstance(context)
                .cancelUniqueWork(RESTORE_WORK_NAME)

            val currentLimits =
                prefs.getString(KEY_TARGET_APPS, "{}") ?: "{}"

            prefs.edit()
                .putString(KEY_PAUSED_APPS, currentLimits)
                .putString(KEY_TARGET_APPS, "{}")
                .apply()
            
            val intent = Intent(ACTION_TARGET_APPS_UPDATED)
            intent.setPackage(context.packageName)
            context.sendBroadcast(intent)

            val restoreWork = OneTimeWorkRequestBuilder<RestoreLimitsWorker>()
                .setInitialDelay(durationSeconds.toLong(), TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                RESTORE_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                restoreWork
            )

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PAUSE_FAILED", e)
        }
    }

    /* ======================= WORKERS ======================= */

    class CleanupWorker(
        context: Context,
        params: WorkerParameters
    ) : CoroutineWorker(context, params) {

        override suspend fun doWork(): Result {
            return try {
                cleanupExpiredApps(applicationContext)

                val next = OneTimeWorkRequestBuilder<CleanupWorker>()
                    .setInitialDelay(1, TimeUnit.MINUTES)
                    .build()

                WorkManager.getInstance(applicationContext).enqueueUniqueWork(
                    CLEANUP_WORK_NAME,
                    ExistingWorkPolicy.REPLACE,
                    next
                )

                Result.success()
            } catch (e: Exception) {
                Result.failure()
            }
        }
    }

    class RestoreLimitsWorker(
        context: Context,
        params: WorkerParameters
    ) : CoroutineWorker(context, params) {

        override suspend fun doWork(): Result {
            return try {
                val prefs =
                    applicationContext.getSharedPreferences(PREF_FILE_KEY, Context.MODE_PRIVATE)

                val paused =
                    prefs.getString(KEY_PAUSED_APPS, "{}") ?: "{}"

                prefs.edit()
                    .putString(KEY_TARGET_APPS, paused)
                    .remove(KEY_PAUSED_APPS)
                    .apply()


                val intent = Intent(ACTION_RESTORE_LIMITS)
                intent.setPackage(applicationContext.packageName)
                applicationContext.sendBroadcast(intent)

                scheduleCleanupWorker(applicationContext)

                Result.success()
            } catch (e: Exception) {
                Result.failure()
            }
        }
    }

}
