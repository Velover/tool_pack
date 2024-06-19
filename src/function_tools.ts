//!native
import { RunService } from "@rbxts/services";

type Underfined<T> = { [P in keyof T]: P extends undefined ? T[P] : never };
type FilterFlags<Base, Condition> = {
  [key in keyof Base]:
  Base[key] extends Condition ? key : never
};

type AllowedNames<Base, Condition> =
  FilterFlags<Base, Condition>[keyof Base];

type SubType<Base, Condition> =
  Pick<Base, AllowedNames<Base, Condition>>;

declare global {
  type GetReturnType<T> = T extends (...args: any[]) => infer K ? K : never
  type OptionalKeys<T> = Exclude<keyof T, NonNullable<keyof SubType<Underfined<T>, never>>>;
  type MakeOnlyOptionalKeys<T> = { [key in OptionalKeys<T>]: T[key] };
}

export namespace FunctionTools {
  export function ExecuteIfClient<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
    if (RunService.IsClient()) return callback(...args);
  }
  export function ExecuteIfServer<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
    if (RunService.IsServer()) return callback(...args);
  }
  /**executes client call back for the client and server callback for the server, returns the callback return arguments */
  export function ExecuteOnServerAndClient<T extends unknown[], ReturnType>(
    server_callback: (...args: T) => ReturnType,
    client_callback: (...args: T) => ReturnType,
    ...args: T): ReturnType {
    if (RunService.IsServer()) return server_callback(...args);
    return client_callback(...args);
  }
  export function Execute<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
    return callback(...args);
  }
  export function ExecuteWith<T>(item: T, callback: (item: T) => void) {
    callback(item);
    return item;
  }

  export function CreateFunctionWithOptionalArguments<T extends {}, ReturnType>(default_parameters: MakeOnlyOptionalKeys<T>, callback: (data: T) => ReturnType) {
    return (data: T): GetReturnType<typeof callback> => {
      //applies all optional values
      const default_map = default_parameters as unknown as Map<keyof T, T[keyof T]>;
      for (const [key, value] of default_map) {
        if (data[key] === undefined) data[key] = value
      }
      return callback(data);
    }
  }

  /**
   * 
   * @param value value to switch
   * @param possible_variants possible variants of value
   * @param possible_answers possible answers with coresponding indexes to variants
   * @param default_value if variant wasnt found, will return a default value
   * @returns if value is a variant, will return the answer with the same index as a variant
   */
  export function SwitchValueIfEquals<T, Q>(value: T, possible_variants: T[], possible_answers: Q[], default_value: Q) {
    for (const i of $range(0, possible_answers.size() - 1)) {
      const variant = possible_variants[i];
      //if value is a variant, will return the answer with the same index
      if (value === variant) return possible_answers[i];
    }
    return default_value;
  }


}

