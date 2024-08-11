//!native
//!optimize 2
export namespace ArrayTools {
	const random = new Random();
	/**
	 *
	 * @param array
	 * @returns shuffled copy of array
	 */
	export function Shuffle<T extends defined>(array: readonly T[]) {
		const array_size = array.size();
		const shuffled_array = new Array<T>(array_size);
		//goes backwards to avoid conflict with randomised numbers;
		//takes the random index and swaps with the current
		for (const i of $range(array_size - 1, 0, -1)) {
			const random_index = random.NextInteger(0, i);
			const random_value = array[random_index];
			//if value in shuffled array exist, dont take from the existing array
			//can cause duplicats
			const current_value = shuffled_array[i] ?? array[i];

			//swaps the values current with random;
			shuffled_array[i] = random_value;
			shuffled_array[random_index] = current_value;
		}

		return shuffled_array;
	}

	/**removes the element from the array */
	export function RemoveElementFromArray<T extends defined>(
		array: T[],
		element: T,
	) {
		return array.remove(array.indexOf(element));
	}

	/**removes all or 1 elements if they check function returns true */
	export function RemoveFromArray<T extends defined>(
		array: T[],
		check: (element: T) => boolean,
		stop_on_first: boolean = true,
	) {
		const indexes_to_remove = new Array<number>();
		for (const i of $range(0, array.size() - 1)) {
			const element = array[i];
			if (!check(element)) continue;
			indexes_to_remove.push(i);
			//stops if stop_on_first flag is true
			if (stop_on_first) break;
		}

		const removed_elements = new Array<T>(indexes_to_remove.size());
		//goest backwards to not mess the indexes
		for (const i of $range(indexes_to_remove.size() - 1, 0, -1)) {
			const index_to_remove = indexes_to_remove[i];
			removed_elements.push(array.remove(index_to_remove)!);
		}

		return removed_elements;
	}

	export function IncludesOneOf<T extends defined>(
		array: readonly T[],
		possible_elements: T[],
	) {
		for (const element of possible_elements) {
			if (array.includes(element)) return true;
		}
		return false;
	}

	/**@returns same elements in the arrays */
	export function GetIntersection<T extends defined>(
		array_0: readonly T[],
		array_1: readonly T[],
	) {
		const intersections = new Array<T>();
		//if the element is in both tables any table could be used
		for (const element of array_0) {
			if (array_1.includes(element)) intersections.push(element);
		}
		return intersections;
	}

	/**if insert_check returns true, element will be inserted at index of value that it's getting compared to
	 * @param a - inserted value
	 * @param b - other value
	 */
	export function SortedInsert<T extends defined>(
		array: T[],
		value: T,
		insert_check: (
			current_value: T,
			b: T,
			index: number,
			array: T[],
		) => boolean,
	) {
		for (const i of $range(0, array.size() - 1)) {
			if (!insert_check(value, array[i], i, array)) continue;
			array.insert(i, value);
			return;
		}
		array.push(value);
	}

	/**
	 * interts elements at position
	 * @param array
	 * @param elements
	 * @param position
	 */
	export function InsertElements<T extends defined>(
		array: Array<T>,
		elements: Array<T>,
		position: number = array.size(),
	) {
		for (const element of elements) {
			array.insert(position++, element);
		}
		return array;
	}

	/**
	 * @param arrays
	 * @returns array that contains all elements from arrays
	 */
	export function JoinArrays<T extends defined>(arrays: readonly T[][]) {
		return arrays.reduce((combined_array, array) => {
			return [...combined_array, ...array];
		}, new Array<T>());
	}

	export function GetRandomElement<T>(array: readonly T[]) {
		//returns array element with random index
		const random_index = random.NextInteger(0, array.size() - 1);
		return array[random_index];
	}

	export type WeigtedArray<T extends defined> = Array<[number, T]>;
	export function WeightedPick<T extends defined>(array: WeigtedArray<T>): T {
		let total_value = 0;
		for (const element of array) {
			const [weight, _] = element;
			total_value += weight;
		}
		let random_value = random.NextNumber() * total_value;
		for (const element of array) {
			const [weight, value] = element;
			if (random_value < weight) return value;
			random_value -= weight;
		}

		error("array doent contain any items");
	}

	/**filters the same value, if selector is undefined will use the element itself to compare */
	export function FilterSame<T extends defined, Q extends defined>(
		array: Array<T>,
		selector?: (element: T) => Q,
	) {
		const indexes_to_remove = new Array<number>();
		const found_values = new Array<defined>();
		for (const i of $range(0, array.size() - 1)) {
			const element = array[i];
			//uses selector to select the element or uses element itself
			const value = selector !== undefined ? selector(element) : element;
			if (found_values.includes(value)) {
				//adds to the indexes in order to remove
				indexes_to_remove.push(i);
				continue;
			}

			found_values.push(value);
		}

		//goes backwards to not mess up indexes
		for (const i of $range(indexes_to_remove.size() - 1, 0, -1)) {
			const index_to_remove = indexes_to_remove[i];
			array.remove(index_to_remove);
		}
		return array;
	}

	/**
	 *
	 * @param array
	 * @param start
	 * @param finish
	 * @returns cut copy of array
	 */
	export function SubArray<T extends defined>(
		array: readonly T[],
		start: number,
		finish: number,
	) {
		const subtracted_array = new Array<T>();
		array.move(start, finish, 0, subtracted_array);
		return subtracted_array;
	}

	export function Compare<T extends defined>(
		array_0: readonly T[],
		array_1: readonly T[],
		selector?: <Q extends defined>(array: readonly T[]) => Q,
	) {
		if (array_0.size() !== array_1.size()) return false;
		for (const i of $range(0, array_0.size() - 1)) {
			const value_0 = selector !== undefined ? selector(array_0) : undefined;
			const value_1 = selector !== undefined ? selector(array_1) : undefined;
			if (value_0 !== value_1) return false;
		}
		return true;
	}

	/**
	 * loops in the opposite direction
	 * equivalent to for(let i = array.size() - 1; i >= 0, i--)
	 */
	export function ReverseLoop<T extends defined>(
		array: readonly T[],
		callback: (value: T, index: number, array: readonly T[]) => void,
	) {
		for (const i of $range(array.size() - 1, 0, -1)) {
			const value = array[i];
			callback(value, i, array);
		}
	}

	/**swaps elements in the table by indexes */
	export function SwapIndexes<T extends defined>(
		array: T[],
		index_0: number,
		index_1: number,
	) {
		const element_0 = array[index_0];
		const element_1 = array[index_1];
		array[index_0] = element_1;
		array[index_1] = element_0;
	}

	/**
	 * @param array
	 * @returns reversed copy of array
	 */
	export function Reverse<T extends defined>(array: readonly T[]) {
		const reversed_array = new Array<T>(array.size());
		ReverseLoop(array, (value, index) => reversed_array.push(value));
		return reversed_array;
	}

	/**
	 * indexes the array and wraps the index
	 * equivalent to array[index % array.size()]
	 */
	export function WrapIndex<T>(array: readonly T[], index: number) {
		const size = array.size();
		return array[size !== 0 ? index % size : 0];
	}

	/**
	 * makes binary search in sorted array
	 * @param array
	 * @param element
	 * @param return_min if didnt find the element and this is true, will return the index of the closes smallest element
	 * @returns index of the element, -1 if didnt find the element
	 */
	export function BinarySearch(
		array: readonly number[],
		element: number,
		return_min?: boolean,
	) {
		let low = 0;
		let high = array.size() - 1;
		while (low <= high) {
			const mid = low + math.floor((high - low) / 2);
			if (array[mid] === element) return mid;
			if (array[mid] < element) {
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		return return_min ? math.max(math.min(low, high), 0) : -1;
	}

	/**
	 * makes binary search in sorted array
	 * @param array
	 * @param element
	 * @param return_min if didnt find the element and this is true, will return the index of the closes smallest element
	 * @returns index of the element, -1 if didnt find the element
	 */
	export function BinarySearchObject<T>(
		array: readonly T[],
		element: number,
		selector: (element: T) => number,
		return_min?: boolean,
	) {
		let low = 0;
		let high = array.size() - 1;
		while (low <= high) {
			const mid = low + math.floor((high - low) / 2);
			const middle_element = selector(array[mid]);
			if (middle_element === element) return mid;
			if (middle_element < element) {
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		return return_min ? math.max(math.min(low, high), 0) : -1;
	}
}
