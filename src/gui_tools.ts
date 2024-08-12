//!native
//!optimize 2
import { ArrayTools } from "./array_tools";
import { DetectingTools2D } from "./detecting_tools_2d";
import { Vector2Tools } from "./vector2_tools";

export namespace GuiTools {
	export function IsPointInside(frame: GuiBase2d, point: Vector2) {
		const half_size = frame.AbsoluteSize.mul(0.5);
		const center = frame.AbsolutePosition.add(half_size);
		let distance = point.sub(center);
		if (frame.AbsoluteRotation !== 0) {
			distance = Vector2Tools.Rotate(
				distance,
				-math.rad(frame.AbsoluteRotation),
			);
		}
		return (
			math.abs(distance.X) <= half_size.X && math.abs(distance.Y) <= half_size.Y
		);
	}

	export function GetBaseCorners(base: GuiBase2d) {
		const abs_position = base.AbsolutePosition;
		const abs_size = base.AbsoluteSize;
		const max_position = abs_position.add(abs_size);
		const points = [
			abs_position,
			new Vector2(max_position.X, abs_position.Y),
			max_position,
			new Vector2(abs_position.X, max_position.Y),
		];
		if (base.AbsoluteRotation === 0) {
			return table.freeze(points);
		}
		const half_size = abs_size.mul(0.5);
		const center = abs_position.add(half_size);
		let index = 0;
		for (const point of points) {
			const offset = point.sub(center);
			const new_offset = Vector2Tools.Rotate(
				offset,
				math.rad(base.AbsoluteRotation),
			);
			const new_point = center.add(new_offset);
			points[index++] = new_point;
		}
		return table.freeze(points);
	}

	function OverlapTest(base_1: GuiBase2d, base_2: GuiBase2d) {
		return DetectingTools2D.ArePolygonsIntersecting(
			GetBaseCorners(base_1),
			GetBaseCorners(base_2),
		);
	}
	function IsNotClipped(object: GuiObject) {
		//noop
		return true;
	}

	function ZIndexInsert(current_value: GuiObject, b: GuiObject) {
		return current_value.ZIndex >= b.ZIndex;
	}
	function GetOGuiObjectsAtPointSibling(
		base: GuiBase2d,
		point: Vector2,
		list: GuiObject[],
		ignore_clipped: boolean = true,
		ignore_not_visible: boolean = true,
	) {
		const children = table.freeze(base.GetChildren());

		for (const child of children) {
			if (!child.IsA("GuiObject")) continue;
			if (!(ignore_not_visible || child.Visible)) continue;
			const can_be_added =
				IsPointInside(child, point) && (ignore_clipped || IsNotClipped(child));
			if (can_be_added) ArrayTools.SortedInsert(list, child, ZIndexInsert);
			GetOGuiObjectsAtPointSibling(
				child,
				point,
				list,
				ignore_clipped,
				ignore_not_visible,
			);
		}

		return list;
	}

	function GetOGuiObjectsAtPointGlobal(
		base: GuiBase2d,
		point: Vector2,
		ignore_clipped: boolean = true,
		ignore_not_visible: boolean = true,
	) {
		const descendands = table.freeze(base.GetDescendants());
		const list = new Array<GuiObject>();

		for (const child of descendands) {
			if (!child.IsA("GuiObject")) continue;
			if (!(ignore_not_visible || child.Visible)) continue;
			if (!(ignore_clipped || IsNotClipped(child))) continue;
			if (!IsPointInside(child, point)) continue;
			ArrayTools.SortedInsert(list, child, ZIndexInsert);
		}

		return list;
	}

	/**
	 *
	 * @param base base 2d where all gui objets will be checked
	 * @param point position of the screen
	 * @param ignore_clipped ignore all gui objects that are clipped ("behind the boundaries") default true
	 * @param ignore_not_visible ignore all gui objects that are not visible default true
	 * @param zindex_behaviour determites mode how it detects the elements
	 */
	export function GetOGuiObjectsAtPoint(
		base: GuiBase2d,
		point: Vector2,
		ignore_clipped: boolean = true,
		ignore_not_visible: boolean = true,
		zindex_behaviour: Enum.ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	) {
		if (zindex_behaviour === Enum.ZIndexBehavior.Sibling) {
			return GetOGuiObjectsAtPointSibling(
				base,
				point,
				[],
				ignore_clipped,
				ignore_not_visible,
			);
		}
		return GetOGuiObjectsAtPointGlobal(
			base,
			point,
			ignore_clipped,
			ignore_not_visible,
		);
	}

	/**
	 *
	 * @param base base 2d where all gui objets will be checked
	 * @param object object to check
	 * @param point position of the screen
	 * @param ignore_clipped ignore all gui objects that are clipped ("behind the boundaries") default true
	 * @param ignore_not_visible ignore all gui objects that are not visible default true
	 * @param zindex_behaviour defaults to Sibling
	 * @returns
	 */
	export function IsObjectSelectedAtPoint(
		base: GuiBase2d,
		object: GuiObject,
		point: Vector2,
		ignore_clipped: boolean = true,
		ignore_not_visible: boolean = true,
		zindex_behaviour: Enum.ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	) {
		if (!IsPointInside(object, point)) return;

		const stack = GetOGuiObjectsAtPoint(
			base,
			point,
			ignore_clipped,
			ignore_not_visible,
			zindex_behaviour,
		);
		if (!stack.includes(object)) return false;

		let index = 0;
		for (const element of stack) {
			index++;
			if (element === object) return true;
			if (element.Active) return false;
		}
		return false;
	}

	export function GuiBaseToRect(base: GuiBase2d) {
		return new Rect(
			base.AbsolutePosition,
			base.AbsolutePosition.add(base.AbsoluteSize),
		);
	}

	export function GetAbsoluteCenter(base: GuiBase2d) {
		return base.AbsolutePosition.add(base.AbsoluteSize.mul(0.5));
	}
}
