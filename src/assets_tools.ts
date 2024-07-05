import { ContentProvider, Players, ReplicatedStorage } from "@rbxts/services";
import { InstanceTools } from "./instance_tools";

export namespace AssetsTools {
	/**
	 * preloads asset with Content Provider
	 */
	export async function TryPreload(
		assets: (string | Instance)[],
		callback?: (contentId: string, status: Enum.AssetFetchStatus) => void,
	) {
		ContentProvider.PreloadAsync(assets, callback);
	}
	/**shortcut for the
	 *  ReplicatedStorage.Assets.Gui[gui_name].Clone().Parent = local_player.PlayerGui */
	export function AddGuiFromAssets(gui_name: string) {
		const gui = InstanceTools.WaitForPath(ReplicatedStorage, [
			"Assets",
			"Gui",
			gui_name,
		]).Clone() as ScreenGui;
		gui.Parent = Players.LocalPlayer.WaitForChild("PlayerGui");
		return gui;
	}
}
