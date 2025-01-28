import { User } from "../models/user"

export const getUserProfile = async (address: string) => {
    let user = await User.findOne({ address: address })
    return user
}

export const getUserById = async (id: string) => {
    let user = await User.findOne({ _id: id })
    return user
}