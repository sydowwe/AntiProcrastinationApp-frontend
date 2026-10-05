/**
 * A mapping rule's role/category target (OP22): the server's third target group beside an activity and
 * *ignored*. This client never creates one, but a rule may hold it, and it has to survive an edit.
 */
export interface RoleCategoryTarget {
	roleId: number | null
	categoryId: number | null
	roleName: string | null
	categoryName: string | null
}

export function hasRoleCategoryTarget(target: RoleCategoryTarget): boolean {
	return target.roleId != null || target.categoryId != null
}
