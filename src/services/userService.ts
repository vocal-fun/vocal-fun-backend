import { User } from "../models/user"

export const getUserProfile = async (address: string) => {
    let user = await User.findOne({ address: address })
    return user
}