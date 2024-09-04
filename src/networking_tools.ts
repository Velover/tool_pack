import { Players } from "@rbxts/services";
import { InstanceTools } from "./instance_tools";

export namespace NetworkingTools {
	export function FireAllClientsExcept(
		remote_event: RemoteEvent,
		exceptions: readonly Player[],
		...args: unknown[]
	) {
		const players = Players.GetPlayers();
		players.forEach((player) => {
			if (exceptions.includes(player)) return;
			remote_event.FireClient(player, ...args);
		});
	}

	/**always returns true */
	function AlwaysTrue() {
		return true;
	}
	/**
	 * sends the data from one client directly to others
	 * sends the player who sent request and the arguments
	 * @param remote_event remote event that is going to be broadcasted to other clients
	 * @param check_arguments_callback checks if the client sends the valid information
	 */
	export function ResendToClientsConnection(
		remote_event: RemoteEvent,
		check_arguments_callback: (...args: unknown[]) => boolean = AlwaysTrue,
	) {
		//takes the arguments from the remote event and fires to all clients except of him
		return remote_event.OnServerEvent.Connect((player, ...args) => {
			//if didnt pass the check, dont send to other clients
			if (!check_arguments_callback(...args)) return;
			FireAllClientsExcept(remote_event, [player], player, ...args);
		});
	}

	function GetOrCreateNetworkFolder() {
		const folder_name = "network__";
		return InstanceTools.GetOrCreate(folder_name, script, "Folder", {});
	}

	/**
	 * creates the remote event for server and client, has to be executed from both sides
	 * @param name name of remote event
	 * @param parent parent where the remote event is located
	 * @returns remote event
	 */
	export function DefineRemoteEvent<
		T extends Callback = Callback,
		Q extends boolean = false,
	>(
		name: string,
		parent: Instance = GetOrCreateNetworkFolder(),
		unreliable?: Q,
	) {
		return <Q extends true ? UnreliableRemoteEvent<T> : RemoteEvent<T>>(
			InstanceTools.DefineItem(
				name,
				parent,
				unreliable ? "UnreliableRemoteEvent" : "RemoteEvent",
				{},
			)
		);
	}

	export function DefineRemoteFunction<T extends Callback = Callback>(
		name: string,
		parent: Instance = GetOrCreateNetworkFolder(),
	) {
		return <RemoteFunction<T>>(
			InstanceTools.DefineItem(name, parent, "RemoteFunction", {})
		);
	}
}
