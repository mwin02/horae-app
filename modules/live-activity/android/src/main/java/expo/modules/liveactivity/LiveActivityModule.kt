package expo.modules.liveactivity

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * No-op Android implementation of the Live Activity bridge.
 *
 * Android has no equivalent to iOS Live Activities — the running-timer
 * surface there will eventually be a foreground notification (separate
 * task). This stub keeps the JS facade platform-agnostic so callers
 * don't need `Platform.OS === 'ios'` guards everywhere; `isSupported()`
 * returns false on Android and every other entry point is a no-op.
 */
class LiveActivityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiveActivity")

    Function("isSupported") { -> false }

    AsyncFunction("start") { _: Map<String, Any?> -> /* no-op */ }
    AsyncFunction("update") { _: Map<String, Any?> -> /* no-op */ }
    AsyncFunction("end") { -> /* no-op */ }
    AsyncFunction("writeWidgetSnapshot") { _: Map<String, Any?>? -> /* no-op */ }
  }
}
