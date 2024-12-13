//!native
//!optimize 2

import { CFrameComponents } from "../cframe_tools";

/**vector with unlimited amount of components */
export class Vector {
	/**
	 * createas the Vector with size amount of value
	 *
	 * value 3 size 2  => new Vector([3, 3])
	 * @param value
	 * @param size
	 * @returns
	 */
	static CreateWithValue(value: number, size: number) {
		return new Vector(table.create(size, value));
	}

	static FromCFrame(cframe: CFrame) {
		return new Vector(cframe.GetComponents());
	}

	static FromCFramesList(cframes_list: CFrame[]) {
		const vectors_list = new Array<Vector>(cframes_list.size());
		for (const i of $range(0, cframes_list.size() - 1)) {
			vectors_list[i] = Vector.FromCFrame(cframes_list[i]);
		}
		return vectors_list;
	}

	readonly Elements: number[];
	private size_: number;
	constructor(args: number[]) {
		this.Elements = table.clone(args);
		this.size_ = args.size();
	}

	Add(vector: Vector) {
		const max_size = math.max(vector.GetSize(), this.size_);
		const elements = new Array<number>(max_size);
		for (const i of $range(0, max_size - 1)) {
			const element_1 = this.Elements[i] ?? 0;
			const element_2 = vector.Elements[i] ?? 0;
			elements[i] = element_1 + element_2;
		}
		return new Vector(elements);
	}

	Sub(vector: Vector) {
		const max_size = math.max(vector.GetSize(), this.size_);
		const elements = new Array<number>(max_size);
		for (const i of $range(0, max_size - 1)) {
			const element_1 = this.Elements[i] ?? 0;
			const element_2 = vector.Elements[i] ?? 0;
			elements[i] = element_1 - element_2;
		}
		return new Vector(elements);
	}

	MulNum(value: number) {
		const elements = new Array<number>(this.size_);
		for (const i of $range(0, this.size_ - 1)) {
			elements[i] = this.Elements[i] * value;
		}
		return new Vector(elements);
	}

	Mul(vector: Vector) {
		const max_size = math.max(vector.GetSize(), this.size_);
		const elements = new Array<number>(max_size);
		for (const i of $range(0, max_size - 1)) {
			const element_1 = this.Elements[i] ?? 0;
			const element_2 = vector.Elements[i] ?? 0;
			elements[i] = element_1 * element_2;
		}
		return new Vector(elements);
	}

	Div(vector: Vector) {
		const max_size = math.max(vector.GetSize(), this.size_);
		const elements = new Array<number>(max_size);
		for (const i of $range(0, max_size - 1)) {
			const element_1 = this.Elements[i] ?? 0;
			const element_2 = vector.Elements[i] ?? 0;
			elements[i] = element_1 / element_2;
		}
		return new Vector(elements);
	}

	/**
	 * @param orthonormalize defaults to true
	 */
	ToCFrame(orthonormalize: boolean = true) {
		const cframe = new CFrame(...(<CFrameComponents>this.Elements));
		return orthonormalize ? cframe.Orthonormalize() : cframe;
	}

	/**
	 * @returns mirrors current point around other vector
	 */
	MirrorAround(mirror_point: Vector) {
		return mirror_point.Add(mirror_point.Sub(this));
	}

	GetSize() {
		return this.size_;
	}
}
