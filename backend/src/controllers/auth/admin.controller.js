import asyncHandler from "express-async-handler"
import User from "../../models/auth/user.models.js";




export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // attempt to find and delete the user
        const user = await User.findByIdAndDelete(id)

        // check if user exisists
        if (!user) {
            //400 Bad Request
            res.status(404).json({ message: "User not found!" });
        }
        // delete user
        res.status(200).json({ mesage: "User deleted successfully!" })
    } catch (error) {
        res.status(500).json({ mesage: "Cannot Delete User" })
    }

});
