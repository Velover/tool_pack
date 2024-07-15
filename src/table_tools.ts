import { ArrayTools } from "./array_tools";

//!native
export type AnyArray<T = any> = Array<T> | ReadonlyArray<T>;
export type AnyMap<K = any, V = any> = Map<K, V> | ReadonlyMap<K, V>;
export type AnyData = {} | AnyMap | AnyArray;

type MutableInterface<T extends {}> = {
	-readonly [key in keyof T]: T[key] extends AnyData ? Mutable<T[key]> : T[key];
};
type MutableMap<T extends AnyMap> =
	T extends AnyMap<infer K, infer V>
		? Map<K, V extends AnyData ? Mutable<V> : V>
		: never;
type MutableArray<T extends AnyArray> =
	T extends AnyArray<infer V>
		? Array<V extends AnyData ? Mutable<V> : V>
		: never;

type ImmutableInterface<T extends {}> = {
	readonly [key in keyof T]: T[key] extends AnyData
		? Immutable<T[key]>
		: T[key];
};
type ImmutableMap<T extends AnyMap> =
	T extends AnyMap<infer K, infer V>
		? Map<K, V extends AnyData ? Immutable<V> : V>
		: never;
type ImmutableArray<T extends AnyArray> =
	T extends AnyArray<infer V>
		? Array<V extends AnyData ? Immutable<V> : V>
		: never;

export type DefinedTable = DefinedMap | DefinedArray;
export type DefinedMap = Map<defined, defined>;
export type DefinedArray = Array<defined>;

export type Mutable<T extends AnyData> = T extends AnyMap
	? MutableMap<T>
	: T extends AnyArray
		? MutableArray<T>
		: T extends {}
			? MutableInterface<T>
			: never;

export type Immutable<T extends AnyData> = T extends AnyMap
	? ImmutableMap<T>
	: T extends AnyArray
		? ImmutableArray<T>
		: T extends {}
			? ImmutableInterface<T>
			: never;

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
	export function CopyData<Data extends AnyData>(
		data: Data,
		callback: (draft: Mutable<Data>) => void,
	): Data {
		//clones the data
		const clone = table.clone(data);
		callback(clone as Mutable<Data>);

		return clone;
	}

	export function DeepCopyData<Data extends AnyData>(
		data: Data,
		callback?: (draft: Mutable<Data>) => void,
	): Data {
		type RecursiveArray = Array<defined | RecursiveArray | RecursiveMap>;
		type RecursiveMap = Map<string, defined | RecursiveArray | RecursiveMap>;

		//clones the data
		const clone = table.clone(data) as unknown as RecursiveArray;
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

		if (callback) callback(clone as unknown as Mutable<Data>);

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

	export function IsArray(data: DefinedTable) {
		return (data as DefinedMap).size() === (data as DefinedArray).size();
	}

	type RecursiveMap = Map<defined, defined | RecursiveMap>;
	export function ExtractElementsFromRecursiveData<Data extends AnyData>(
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
		map: Map<K, V>,
		check: (value: V, key: K, map: Map<K, V>) => boolean,
	) {
		const filtered_map = new Map<K, V>();
		for (const [key, value] of map) {
			if (check(value, key, map)) filtered_map.set(key, value);
		}

		return filtered_map;
	}

	/**@returns first element from the map [key, value] */
	export function GetFirst<K, V>(map: Map<K, V>) {
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

	export function GetOrCreate<K, V>(
		map: Map<K, V>,
		key: K,
		create_callback: (key: K, map: Map<K, V>) => V,
	) {
		return map.get(key) ?? map.set(key, create_callback(key, map)).get(key);
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
}
