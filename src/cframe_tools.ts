//!native
//!optimize 2

export type CFrameComponents = [
	x: number,
	y: number,
	z: number,
	r00: number,
	r01: number,
	r02: number,
	r10: number,
	r11: number,
	r12: number,
	r20: number,
	r21: number,
	r22: number,
];

export namespace CFrameTools {
	export function AddCFrames(cframe_0: CFrame, cframe_1: CFrame) {
		const components_0 = cframe_0.GetComponents();
		const components_1 = cframe_1.GetComponents();
		for (const i of $range(0, components_0.size() - 1)) {
			components_0[i] += components_1[i];
		}
		return new CFrame(...(<CFrameComponents>components_0));
	}

	export function SubCFrames(cframe_0: CFrame, cframe_1: CFrame) {
		const components_0 = cframe_0.GetComponents();
		const components_1 = cframe_1.GetComponents();
		for (const i of $range(0, components_0.size() - 1)) {
			components_0[i] -= components_1[i];
		}
		return new CFrame(...(<CFrameComponents>components_0));
	}

	export function MulCFrameByNumber(cframe: CFrame, value: number) {
		const components_0 = cframe.GetComponents();
		for (const i of $range(0, components_0.size() - 1)) {
			components_0[i] *= value;
		}
		return new CFrame(...(<CFrameComponents>components_0));
	}

	export function MulCFramesComponents(cframe_0: CFrame, cframe_1: CFrame) {
		const components_0 = cframe_0.GetComponents();
		const components_1 = cframe_1.GetComponents();
		for (const i of $range(0, components_0.size() - 1)) {
			components_0[i] += components_1[i];
		}
		return new CFrame(...(<CFrameComponents>components_0));
	}

	/**
	 *
	 * @param a CFrame
	 * @param b CFrame
	 * @returns a mirrored around b
	 */
	export function MirrorAround(a: CFrame, b: CFrame) {
		return AddCFrames(b, SubCFrames(b, a));
	}

	/**
	 *
	 * @param a CFrame
	 * @param b CFrame
	 * @param use_rotation_b if true the end cframe will have the rotation of b, defaults to false
	 * @returns a position mirrored around b position with rotation of selected component
	 * used for the splines
	 */
	export function MirrorPositionAround(
		a: CFrame,
		b: CFrame,
		use_rotation_b?: boolean,
	) {
		const position = b.Position.add(b.Position.sub(a.Position));
		return use_rotation_b ? b.Rotation.add(position) : a.Rotation.add(position);
	}

	/**
	 *
	 * @param cframe
	 * @returns determinant of rotation matrix
	 */
	export function RotationDet(cframe: CFrame) {
		const [x, y, z, a, b, c, d, e, f, g, h, i] = cframe.GetComponents();
		return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	}

	/**
	 *
	 * @param cframe
	 * @returns turns every nan component into 0
	 */
	export function FixCFrame(cframe: CFrame) {
		if (cframe === cframe) return cframe;
		const components = cframe.GetComponents();
		const new_components = new Array<number>(12);
		for (let i = 0; i < components.size(); i++) {
			new_components[i] = components[i] === components[i] ? components[i] : 0;
		}
		return new CFrame(...(new_components as CFrameComponents));
	}
}
