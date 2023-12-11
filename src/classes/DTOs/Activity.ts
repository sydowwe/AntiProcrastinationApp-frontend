import { Category } from "./Category";
import { Role } from "./Role";

export class Activity {
  constructor(
    public id: number | null = null,
    public name: string | null = null,
    public text: string | null = null,
    public isOnToDoList: boolean = false,
    public isUnavoidable: boolean = false,
    public role: Role | null = null,
    public category: Category | null = null
  ) {}
    }