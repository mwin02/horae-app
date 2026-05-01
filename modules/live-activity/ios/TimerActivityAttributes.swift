import ActivityKit
import Foundation

// IMPORTANT: This file is intentionally duplicated in
// `targets/live-activity/TimerActivityAttributes.swift` (the widget
// extension's copy). ActivityKit identifies activities by the
// type's unqualified name, so as long as both copies declare a struct
// named `TimerActivityAttributes` with an identical Codable
// `ContentState`, the host app and the widget extension can talk to
// each other across processes. **Keep the two files in sync.**
@available(iOS 16.1, *)
public struct TimerActivityAttributes: ActivityAttributes {
    public typealias TimerStatus = ContentState

    public struct ContentState: Codable, Hashable {
        public var startedAt: Date
        public var activityName: String
        public var categoryColorHex: String

        public init(startedAt: Date, activityName: String, categoryColorHex: String) {
            self.startedAt = startedAt
            self.activityName = activityName
            self.categoryColorHex = categoryColorHex
        }
    }

    public init() {}
}
