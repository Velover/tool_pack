import { HttpService } from "@rbxts/services";
import { FunctionTools } from "./function_tools";

export namespace HttpTools {
  //removes lines with comments from the code
  //with them, cannot decode
  export function RemoveJSONComments(json_code_text: string) {
    const lines = json_code_text.split("\n");
    const filtered_lines = lines.filter((value) => {
      //filters the // comments
      //allow if amount of comments on line is 0;
      return value.match("//").size() === 0;
    });
    //joines with the space;
    return filtered_lines.join(" ");
  }

  //returns decoded data from HttpSerivce
  type Attempt<ReturnType = unknown> = LuaTuple<[boolean, ReturnType?]>;
  export function FetchJSONFromLink<ReturnType>(link: string, remove_comments: boolean = true, warn_on_error: boolean = false): Attempt<ReturnType> {
    let success = true;
    let result = undefined;
    try {
      const raw_data = HttpService.GetAsync(link);
      //removes commands if remove_comments is true
      result = HttpService.JSONDecode(remove_comments ? RemoveJSONComments(raw_data) : raw_data);
    } catch (error) {
      success = false;
      if (warn_on_error) warn(error);
    }

    return $tuple(success, success ? result as ReturnType : undefined);
  }

  /**
   * 
   * @param domain domain url without / at the end ```https://lospec.com/```
   * @param path path of the domain ```palette-list```
   * @param default_parameters default values of the data that it can send
   * @returns async function thats returns data from the link and going to accept required data in form of a object and it's going to be encoded in url
   */
  export function ConstructGetRequest<Data extends {} = {}>(domain: string, path: string, default_parameters?: MakeOnlyOptionalKeys<Data>) {
    const url = `${domain}/${path}`
    if (default_parameters === undefined) {
      return async () => {
        return HttpService.GetAsync(url);
      }
    }
    const SetParameters = async (data: Data) => {
      const data_map = data as unknown as Map<keyof Data, Data[keyof Data]>;
      let index = 0;
      let parameters = ""
      data_map.forEach((value, key) => {
        //checks if it's a first parameter and add ?, otherwise will add & before
        const prefix = index === 0 ? "?" : "&";
        index++;
        parameters += `${prefix}${value}=${tostring(key)}`;
      })
      return HttpService.GetAsync(url + parameters);
    }

    return FunctionTools.CreateFunctionWithOptionalArguments<Data, Promise<string>>(default_parameters, SetParameters);
  }

}
