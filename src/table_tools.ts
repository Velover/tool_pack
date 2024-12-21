//!native
import { ArrayTools } from "./array_tools";

export type Objectish = AnyObject | AnyArray | AnyMap | AnySet;

export type AnyObject = { [key: string]: unknown };
export type AnyArray = readonly unknown[];
export type AnySet = ReadonlySet<unknown>;
export type AnyMap = ReadonlyMap<unknown, unknown>;

export type DefinedArray = readonly defined[];
export type DefinedSet = ReadonlySet<defined>;
export type DefinedMap = ReadonlyMap<defined, defined>;

type PrimitiveType = number | string | boolean;
type AtomicObject = Callback | Promise<unknown>;

/**
 * If the lib "ES2015.Collection" is not included in tsconfig.json,
 * types like ReadonlyArray, WeakMap etc. fall back to `any` (specified nowhere)
 * or `{}` (from the node types), in both cases entering an infinite recursion in
 * pattern matching type mappings
 * This type can be used to cast these types to `void` in these cases.
 */
type IfAvailable<T, Fallback = void> =
	// fallback if any
	true | false extends (T extends never ? true : false)
		? Fallback // fallback if empty type
		: keyof T extends never
			? Fallback // original type
			: T;

/**
 * These should also never be mapped but must be tested after regular Map and
 * Set
 */
type WeakReferences =
	| IfAvailable<WeakMap<AnyObject, unknown>>
	| IfAvailable<WeakSet<AnyObject>>;

type MutableObject<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

/**@alias Draft in rbxts/immut */
export type Mutable<T> = T extends PrimitiveType
	? T
	: T extends AtomicObject
		? T
		: T extends ReadonlyMap<infer K, infer V> // Map extends ReadonlyMap
			? Map<Mutable<K>, Mutable<V>>
			: T extends ReadonlySet<infer V> // Set extends ReadonlySet
				? Set<Mutable<V>>
				: T extends WeakReferences
					? T
					: T extends object
						? MutableObject<T>
						: T;

type ImmutableObject<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

export type Immutable<T> = T extends PrimitiveType
	? T
	: T extends AtomicObject
		? T
		: T extends ReadonlyMap<infer K, infer V> // Map extends ReadonlyMap
			? ReadonlyMap<Immutable<K>, Immutable<V>>
			: T extends ReadonlySet<infer V> // Set extends ReadonlySet
				? ReadonlySet<Immutable<V>>
				: T extends WeakReferences
					? T
					: T extends object
						? ImmutableObject<T>
						: T;

type Underfined<T> = { [P in keyof T]: P extends undefined ? T[P] : never };
type FilterFlags<Base, Condition> = {
	[key in keyof Base]: Base[key] extends Condition ? key : never;
};

type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];

type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>;

export type OptionalKeys<T> = Exclude<
	keyof T,
	NonNullable<keyof SubType<Underfined<T>, never>>
>;
export type MakeOnlyOptionalKeys<T> = { [key in OptionalKeys<T>]: T[key] };

export namespace TableTools {
	/**
	 * clones the immutable data and executes the function with draft as argument
	 * @param data data to be cloned
	 * @param callback draft is a clone of the data with readonly flag removed
	 * @returns new changed copy of data (draft)
	 */
	export function CopyData<Data extends Objectish>(
		data: Data,
		callback: (draft: Mutable<Data>) => void,
	): Data {
		//clones the data
		const clone = table.clone(data);
		callback(clone as Mutable<Data>);

		return clone;
	}

	export function DeepCopyData<Data extends object>(
		data: Data,
		callback?: (draft: Mutable<Data>) => void,
	): Data {
		type RecursiveArray = Array<defined | RecursiveArray | RecursiveMap>;
		type RecursiveMap = Map<string, defined | RecursiveArray | RecursiveMap>;

		//clones the data
		const clone = table.clone(data) as RecursiveArray;
		if (IsArray(clone)) {
			//type is already array
			const cloned_table = clone;
			cloned_table.forEach((value, index) => {
				clone[index] = typeIs(value, "table") ? DeepCopyData(value) : value;
			});
		} else {
			//type is already array
			const cloned_table = clone as unknown as RecursiveMap;
			cloned_table.forEach((value, key) => {
				cloned_table.set(
					key,
					typeIs(value, "table") ? DeepCopyData(value) : value,
				);
			});
		}

		if (callback) callback(clone as Mutable<Data>);

		return clone as Data;
	}

	export function FillOutDefaults<T extends {}>(
		data: Partial<T>,
		default_data: T,
	) {
		return { ...default_data, ...data };
	}

	type GetKeyType<T extends AnyMap> =
		T extends Map<infer K, defined>
			? K
			: T extends ReadonlyMap<infer K, defined>
				? K
				: never;

	type GetValueType<T extends AnyMap> =
		T extends Map<defined, infer V>
			? V
			: T extends ReadonlyMap<defined, infer V>
				? V
				: never;

	/**returns the keys of the map */
	export function GetKeys<T extends DefinedMap>(map: T): GetKeyType<T>[] {
		const keys = new Array<defined>();
		for (const [key, _] of map) {
			keys.push(key);
		}
		return keys as GetKeyType<T>[];
	}

	/**returns the values of the map */
	export function GetValues<T extends DefinedMap>(map: T): GetValueType<T>[] {
		const values = new Array<defined>();
		for (const [_, value] of map) {
			values.push(value);
		}

		return values as GetValueType<T>[];
	}

	export function IsArray(data: object) {
		return (data as DefinedMap).size() === (data as DefinedArray).size();
	}

	type RecursiveMap = Map<defined, defined | RecursiveMap>;
	export function ExtractElementsFromRecursiveData<Data extends object>(
		data: Data,
		check: (
			element: defined,
			key: defined,
			taken_elements: Array<defined>,
			data: Data,
		) => boolean,
		ignore_table_if_added: boolean = true,
	) {
		const taken_elements = new Array<defined>();
		const array = data as unknown as RecursiveMap;

		const CheckElement = (key: defined, element: defined) => {
			const is_table = typeIs(element, "table");
			const should_be_added = check(element, key, taken_elements, data);
			if (should_be_added) taken_elements.push(element);
			//ignore the table if it was added
			if (is_table && should_be_added && ignore_table_if_added) return;
			//extracts elements from the table recursively
			if (is_table) ExtractElements(element as RecursiveMap);
		};

		const ExtractElements = (array: RecursiveMap) => {
			for (const [key, element] of array) {
				CheckElement(key, element);
			}
		};

		ExtractElements(array);
		return taken_elements;
	}
	export function Filter<K, V>(
		map: ReadonlyMap<K, V>,
		check: (value: V, key: K, map: ReadonlyMap<K, V>) => boolean,
	) {
		const filtered_map = new Map<K, V>();
		for (const [key, value] of map) {
			if (check(value, key, map)) filtered_map.set(key, value);
		}

		return filtered_map;
	}

	/**@returns first element from the map [key, value] */
	export function GetFirst<T extends DefinedMap>(map: T) {
		for (const [key, value] of map) {
			return $tuple(key, value);
		}
	}

	export function GetRandomKey<T extends DefinedMap>(map: T) {
		return ArrayTools.GetRandomElement(TableTools.GetKeys(map));
	}

	export function GetRandomValue<T extends DefinedMap>(map: T) {
		return ArrayTools.GetRandomElement(TableTools.GetValues(map));
	}

	export function GetOrCreate<
		T extends DefinedMap,
		K = GetKeyType<T>,
		V = GetValueType<T>,
	>(map: Map<K, V>, key: K, create_callback: (key: K, map: Map<K, V>) => V) {
		return map.get(key) ?? map.set(key, create_callback(key, map)).get(key)!;
	}

	export function Find<K, V>(
		map: ReadonlyMap<K, V>,
		check: (element: V, key: K, map: ReadonlyMap<K, V>) => boolean,
	) {
		for (const [key, value] of map) {
			if (check(value, key, map)) return value;
		}
	}

	export function FindKey<K, V>(
		map: ReadonlyMap<K, V>,
		check: (element: V, key: K, map: ReadonlyMap<K, V>) => boolean,
	) {
		for (const [key, value] of map) {
			if (check(value, key, map)) return key;
		}
	}

	export function KeyOf<K, V>(map: ReadonlyMap<K, V>, seached_value: V) {
		for (const [key, value] of map) {
			if (seached_value === value) return key;
		}
	}

	export function ToPairs<K, V>(map: ReadonlyMap<K, V>): [K, V][] {
		const key_value_pairs: [K, V][] = [];
		for (const [k, v] of map) {
			key_value_pairs.push([k, v]);
		}
		return key_value_pairs;
	}

	export function MapToArray<K, V, Q extends defined>(
		map: ReadonlyMap<K, V>,
		selector: (key: K, value: V, map: ReadonlyMap<K, V>) => Q,
	): Q[] {
		const array: Q[] = [];
		for (const [key, value] of map) {
			const selected_value = selector(key, value, map);
			array.push(selected_value);
		}
		return array;
	}

	export function MapToArrayFiltered<K, V, Q extends defined>(
		map: ReadonlyMap<K, V>,
		selector: (key: K, value: V, map: ReadonlyMap<K, V>) => Q | void,
	): Q[] {
		const array: Q[] = [];
		for (const [key, value] of map) {
			const selected_value = selector(key, value, map);
			if (selected_value === undefined) continue;
			array.push(selected_value);
		}
		return array;
	}

	/**
	 *
	 * @param new_map
	 * @param old_map
	 * @returns keys that dont exist in new_map, but exist in old_map
	 */
	export function GetMissingKeys<K extends defined>(
		new_map: ReadonlyMap<K, unknown>,
		old_map: ReadonlyMap<K, unknown>,
	): K[] {
		const missing_keys: K[] = [];

		for (const [old_key] of old_map) {
			if (!new_map.has(old_key)) missing_keys.push(old_key);
		}
		return missing_keys;
	}

	/**
	 *
	 * @param new_map
	 * @param old_map
	 * @returns keys that exist in new_map, but dont exist in old_map
	 */
	export function GetNewKeys<K extends defined>(
		new_map: ReadonlyMap<K, unknown>,
		old_map: ReadonlyMap<K, unknown>,
	): K[] {
		const new_keys: K[] = [];
		for (const [new_key] of new_map) {
			if (!old_map.has(new_key)) new_keys.push(new_key);
		}
		return new_keys;
	}

	/**
	 *
	 * @param new_map
	 * @param old_map
	 * @param selector
	 * @param ignore_missing_or_new_keys
	 * @returns keys of different values
	 */
	export function GetDifferentValueKeys<K extends defined, V1, V2>(
		new_map: ReadonlyMap<K, V1>,
		old_map: ReadonlyMap<K, V2>,
		selector?: (
			value_1: V1,
			value_2: V2,
			key_1: K,
			key_2: K,
			map_1: ReadonlyMap<K, V1>,
			map_2: ReadonlyMap<K, V2>,
		) => boolean,
		ignore_missing_or_new_keys: boolean = false,
	): K[] {
		const different_keys: K[] = [];
		for (const [new_key, value] of new_map) {
			const old_value = old_map.get(new_key);
			if (old_value === undefined && ignore_missing_or_new_keys) continue;

			//new keys
			if (old_value === undefined) {
				different_keys.push(new_key);
				continue;
			}

			let are_same: boolean;
			if (selector === undefined) {
				are_same = value === old_value;
			} else {
				are_same = selector(
					value,
					old_value,
					new_key,
					new_key,
					new_map,
					old_map,
				);
			}

			if (are_same) continue;
			different_keys.push(new_key);
		}

		//missing keys
		if (!ignore_missing_or_new_keys) {
			for (const [old_key] of old_map) {
				if (!new_map.has(old_key)) different_keys.push(old_key);
			}
		}

		return different_keys;
	}

	/**
	 * maps the map to the new map
	 * @param map map
	 * @param selector => [new_key, new_value]
	 * @returns mapped map from map
	 */
	export function MapToNew<K0, V0, K1, V1>(
		map: ReadonlyMap<K0, V0>,
		selector: (key: K0, value: V0, map: ReadonlyMap<K0, V0>) => [K1, V1],
	): Map<K1, V1> {
		const output = new Map<K1, V1>();
		for (const [key_0, value_0] of map) {
			const [key_1, value_1] = selector(key_0, value_0, map);
			output.set(key_1, value_1);
		}

		return output;
	}

	/**
	 * maps the map to the new map, if no value was returned will filter the value
	 * @param map map
	 * @param selector => [new_key, new_value]
	 * @returns mapped filtered map from map
	 */
	export function MapFiltered<K0, V0, K1, V1>(
		map: ReadonlyMap<K0, V0>,
		selector: (
			key: K0,
			value: V0,
			map: ReadonlyMap<K0, V0>,
		) => void | undefined | [K1, V1],
	): Map<K1, V1> {
		const output = new Map<K1, V1>();
		for (const [key_0, value_0] of map) {
			const selector_output = selector(key_0, value_0, map);
			if (selector_output === undefined) continue;
			output.set(selector_output[0], selector_output[1]);
		}

		return output;
	}
}
