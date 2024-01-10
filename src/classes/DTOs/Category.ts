export class Category {
  constructor(
    public id: number = 0,
    public name : string = '',
    public text: string | null = null,
    public color: string | null = null,
    public icon: string | null = null,
  ) {}
  }