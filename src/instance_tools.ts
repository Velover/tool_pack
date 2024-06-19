import { Players } from "@rbxts/services";
import { FunctionTools } from "./function_tools";


export type InstancePropertiesList<T extends Instance> = { [key in keyof WritableInstanceProperties<T>]?: WritableInstanceProperties<T>[key] };
export namespace InstanceTools {
  const random = new Random();

  /**
   * creates instance
   * @param class_name 
   * @param properties partial properties
   * @returns created instancce
   */
  export function Create<T extends keyof CreatableInstances>(class_name: T, properties: InstancePropertiesList<CreatableInstances[T]>) {
    //creates the instance
    const instance = new Instance(class_name) as CreatableInstances[T];
    //assigns the properties
    AsignProperties(instance, properties);
    return instance
  }

  /**
   * @param instance 
   * @param properties partial properties
   * @returns 
   */
  export function AsignProperties<T extends Instance>(instance: T, properties: InstancePropertiesList<T>) {
    //needs the type cast to set the properties to the instance
    const writable_instance = instance as unknown as { [key in keyof WritableInstanceProperties<T>]: WritableInstanceProperties<T> }
    const properties_map = properties as unknown as Map<keyof WritableInstanceProperties<T>, WritableInstanceProperties<T>>;
    for (const [property_name, value] of properties_map) {
      writable_instance[property_name] = value;
    }
    return instance;
  }

  export function IsDescendantOf(instance: Instance, possible_ancestor_list: Instance[]) {
    for (const ancestor of possible_ancestor_list) {
      if (instance.IsDescendantOf(ancestor)) return true;
    }
    return false;
  }
  /**
   * loads a copy of settings from module script as an interface, and takes missing values from default settings
   * @param module_script module script where are the settings
   * @param default_settings default settings
   * @returns copy of settings loaded from module script
   */
  export function LoadSettingsFromModuleScript<T extends {}>(module_script: ModuleScript, default_settings: T) {
    const settings = require(module_script) as Map<keyof T, unknown>;
    //creates a copy of data
    const settings_copy = new Map<keyof T, unknown>();
    //converts default settings to a map
    //itterates over it and looks for the same settings in module script
    for (const [name, default_setting] of default_settings as unknown as Map<keyof T, unknown>) {
      //sets the value of module script or of default settings
      settings_copy.set(name, settings.get(name) ?? default_setting);
    }

    return settings_copy as unknown as T;
  }
  /**finds the ancestor that meets the criteria of the check function */
  export function FindAncestor(instance: Instance, check_function: (instance: Instance) => boolean): Instance | undefined {
    while (instance.Parent !== undefined) {
      //sets the parent of the instance
      instance = instance.Parent
      //checks the parent and returns if passed a check
      if (check_function(instance)) return instance;
    }
  }

  /**looks for the child where check_function return true */
  export function FindChild(instance: Instance, check_function: (instance: Instance) => boolean, recursive?: boolean): Instance | undefined {
    const children = recursive ? instance.GetDescendants() : instance.GetChildren();
    return children.find(check_function);
  }

  /**looks for the ancestor which is a character that belongs to a player */
  export function GetPlayerCharacterFromInstace(part: Instance): Model | undefined {
    const character = FindAncestor(part, (instance) => {
      return instance.IsA("Model") && Players.GetPlayerFromCharacter(instance) !== undefined
    });

    return character as Model;
  }

  /**looks for the ancestor which is a character and returns a player associated with it */
  export function GetPlayerFromInstance(part: Instance): Player | undefined {
    return Players.GetPlayerFromCharacter(GetPlayerCharacterFromInstace(part));
  }

  /**checks the backpack and the character */
  export function SearchToolInPlayer(player: Player, tool_name: string) {
    const search_function = (instance: Instance) => instance.IsA("Tool") && instance.Name === tool_name;
    //first looks in the backpack for the tool named tool_name
    const backpack = player.WaitForChild("Backpack");
    const tool = FindChild(backpack, search_function);
    if (tool !== undefined) return tool;

    //if didnt find the tool, looks in the player character if the character is not nil
    if (player.Character === undefined) return;
    return FindChild(player.Character, search_function);
  }

  /**clears all the tags from the instance */
  export function RemoveTags(instance: Instance) {
    const tags = instance.GetTags();
    for (const tag of tags) instance.RemoveTag(tag);
  }

  /**cleans all the the tags from the instance and it's descendants */
  export function DeepRemoveTags(instance: Instance) {
    const descendants = instance.GetDescendants();
    descendants.forEach(RemoveTags);
  }

  export function WaitForPath<T extends Instance = Instance>(instance: Instance, path: string[]) {
    let child = instance;
    for (const name of path) {
      //used for error handling
      let previous = child

      //if the name is .. go to parent, otherwise find first child
      child = name === ".." ? child!.Parent! : child!.WaitForChild(name);
      assert(child !== undefined, `${previous.GetFullName()} doesnt have parent`);
    }
    return child as T;
  }

  export function FindFirstOnPath<T extends Instance = Instance>(instance: Instance, path: string[]) {
    let child: Instance | undefined = instance;
    for (const name of path) {
      //if the name is .. go to parent, otherwise find first child
      child = name === ".." ? child!.Parent : child!.FindFirstChild(name);
      //returns if something on the path is nil
      if (child === undefined) return;
    }
    return child as T;
  }
  /**returns random position in part */
  export function GetRandomPositionInPart(part: BasePart) {
    const unit_vector = random.NextUnitVector();
    const half_size = part.Size.mul(.5);
    const position = part.Position;
    return position.add(half_size.mul(unit_vector));
  }

  /**
   * creates the item for the server and client, has to be called from the both sides
   * @param name 
   * @param parent 
   * @param class_name 
   * @param properties 
   * @returns 
   */
  export function DefineItem<T extends keyof CreatableInstances>(name: string, parent: Instance, class_name: T, properties: InstancePropertiesList<CreatableInstances[T]>) {
    const instance = FunctionTools.ExecuteOnServerAndClient(() => {
      assert(parent.FindFirstChild(name) === undefined, `Instance with name ${name} is already in ${parent.GetFullName()}`);
      const instance = Create(class_name, properties);
      instance.Name = name
      instance.Parent = parent;
      return instance;
    }, () => {
      const instance = parent.WaitForChild(name);
      return instance
    })
    return instance as CreatableInstances[T];
  }

  export function GetOrCreate<T extends keyof CreatableInstances>(name: string, parent: Instance, class_name: T, properties: InstancePropertiesList<CreatableInstances[T]>) {
    let instance = parent.FindFirstChild(name) as CreatableInstances[T] | undefined;
    if (instance !== undefined) return instance
    instance = InstanceTools.Create<T>(class_name, properties)!;
    instance.Name = name
    instance.Parent = parent
    return instance;
  }
}