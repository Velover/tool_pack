import { Players, ReplicatedStorage } from "@rbxts/services";
import { FunctionTools } from "./function_tools";
import { InstanceTools } from "./instance_tools";

export namespace NetworkingTools {
  export function FireAllClientsExcept(remote_event: RemoteEvent, exceptions: readonly Player[], ...args: unknown[]) {
    const players = Players.GetPlayers();
    players.forEach((player) => {
      if (exceptions.includes(player)) return;
      remote_event.FireClient(player, ...args);
    })
  }

  /**always returns true */
  function AlwaysTrue() {
    return true
  }
  /**
   * sends the data from one client directly to others
   * sends the player who sent request and the arguments
   * @param remote_event remote event that is going to be broadcasted to other clients
   * @param check_arguments_callback checks if the client sends the valid information
   */
  export function ResendToClientsConnection(remote_event: RemoteEvent, check_arguments_callback: (...args: unknown[]) => boolean = AlwaysTrue) {
    //takes the arguments from the remote event and fires to all clients except of him
    return remote_event.OnServerEvent.Connect((player, ...args) => {
      //if didnt pass the check, dont send to other clients
      if (!check_arguments_callback(...args)) return;
      FireAllClientsExcept(remote_event, [player], player, ...args)
    });
  }

  //creates a network folder for the client and the server to 
  const network_folder = FunctionTools.ExecuteOnServerAndClient(() => {
    const folder = InstanceTools.Create("Folder", {
      Name: "network__",
      Parent: ReplicatedStorage
    })
    return folder
  }, () => {
    const folder = <Folder>ReplicatedStorage.WaitForChild("network__");
    return folder;
  });

  export function DefineRemoteEvent<T extends Callback = Callback>(name: string, parent: Instance = network_folder) {
    const remote = FunctionTools.ExecuteOnServerAndClient(() => {
      //to ensure that there's no instances with the same name as remote event
      assert(parent.FindFirstChild(name) === undefined, `Failed to create RemoteEvent. Instance with name: ${name} already exist in ${parent.GetFullName()}`)
      const remote_event = InstanceTools.Create("RemoteEvent", {
        Name: name,
        Parent: network_folder
      })
      return remote_event;
    }, () => {
      const remote_event = <RemoteEvent>network_folder.WaitForChild(name);
      return remote_event;
    })

    return remote as RemoteEvent<T>;
  }

  export function DefineRemoteFunction<T extends Callback = Callback>(name: string, parent: Instance = network_folder) {
    const remote = FunctionTools.ExecuteOnServerAndClient(() => {
      //to ensure that there's no instances with the same name as remote event
      assert(parent.FindFirstChild(name) === undefined, `Failed to create RemoteFunction. Instance with name: ${name} already exist in ${parent.GetFullName()}`)
      const remote_function = InstanceTools.Create("RemoteFunction", {
        Name: name,
        Parent: parent
      })
      return remote_function;
    }, () => {
      const remote_function = <RemoteFunction>parent.WaitForChild(name);
      return remote_function;
    })

    return remote as RemoteFunction<T>;
  }
}