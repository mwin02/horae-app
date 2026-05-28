import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "horae.tutorial.v1.seen";

export async function getTutorialSeen(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function setTutorialSeen(seen: boolean): Promise<void> {
  try {
    if (seen) {
      await AsyncStorage.setItem(KEY, "1");
    } else {
      await AsyncStorage.removeItem(KEY);
    }
  } catch {
    // best effort
  }
}
