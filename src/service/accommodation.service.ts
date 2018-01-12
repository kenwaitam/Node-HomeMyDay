import { Accommodation, IAccommodationModel } from '../model/accommodation.model';
import { IAccommodationDocument } from '../model/schemas/accommodation.schema';

export class AccommodationService {

    /**
     * Gets a list of accommodations
     * @returns All accommodations from the Mongo database.
     */
    public static async getAccommodations() {
        return await Accommodation.find({});
    }

    /**
     * Gets an accommodation of the ID
     * @param id The Object ID to search by.
     * @returns A single accommodation.
     */
    public static async getAccommodation(id: string) {
        return await Accommodation.findById(id);
    }

    /**
     * Gets a list of accommodations
     * @returns All recommended accommodations from the Mongo database.
     */
    public static async GetRecommendedAccommodations() {
        return await Accommodation.find({});
    }

    /**
     * Gets all accommodations that match the given search parameters.
     * Will only return accommodations that can fit the requested amount of persons.
     * Will also only return accommodations which are not already booked in the requested timeframe.
     * @param location The location of the accommodation.
     * @param from The start date of the search.
     * @param to The end date of the search.
     * @param persons The amount of persons that the accommodation has to hold.
     */
    public static async searchAccommodations(location: string, from: Date, to: Date, persons: number) {

        // Find all accommodations which match or partially match the given location.
        // Filters out any accommodations that are already booked within the given timeframe.
        // https://stackoverflow.com/a/26877645/3714134
        return await Accommodation.find({
            location: { $regex: location, $options: 'i' },
            maxPersons: { $gte: persons },
            bookings: {
                $not: {
                    $elemMatch: { dateFrom: { $lt: to }, dateTo: { $gt: from } }
                }
            }
        });
    }

   /**
    * Gets the accommodations for one user
    * @param id The id of the user
    */
    public static async getForUser(userId: string) {
        return await Accommodation.find({
            userId
        });
    }

    /**
     * Create a new accomodation
     * @param accomodation the accomodation object.
     * @returns A new accommodation.
     */
    public static async addAccommodation(accommodation: IAccommodationDocument) {
        return await Accommodation.create(accommodation);
    }

    /**
     * Updates a single accommodation.
     * @param id The ID of the accommodation to update.
     * @param accommodation The new values for the accommodation.
     */
    public static async updateAccommodation(id: string, accommodation: IAccommodationDocument) {
        return await Accommodation.findByIdAndUpdate(id, accommodation, { new: true });
    }

    /**
     * Deletes an accommodation of the ID
     * @param id The Object ID to delete.
     */
    public static async deleteAccommodation(id) {
        return await Accommodation.findByIdAndRemove(id);
    }
}
