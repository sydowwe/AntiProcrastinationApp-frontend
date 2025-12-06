export class User {
    constructor(
      public id: number = 0,
      public email: string = '',
      public twoFactorEnabled: boolean = false,
    ) {}
    static fromJson(object: any){
      const {
        id = 0,
        email = '',
        twoFactorEnabled = false,
      } = object;
      return new User(id, email, twoFactorEnabled);
    }
}
