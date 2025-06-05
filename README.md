# RU My Roommate
**Course**: Software Engineering, 14:332:452, Spring 2025 <br>
**Group**: Cache Me Outside <br>
**Note**: This is a fork of the original team repo. The features I contributed include: OP-08 API endpoint for saved listings, main page auth use case, backend validation, Jasmine tests
**Members**:
- Vladyslav Bartkiv (VladyslavBartkiv), vb425@scarletmail.rutgers.edu
- Jaron Chen (cheyzejc), jc2929@scarletmail.rutgers.edu
- Cameron Francois (CyberVenus), cmf241@scarletmail.rutgers.edu
- Kayla El-Hachem (kaylaelhachem), ke246@scarletmail.rutgers.edu
- Mariana Hernandez (Mariana0101), mh1515@scarletmai.rutgers.edu
- Miguel Pagador (mlp276), mlp276@scarletmail.rutgers.edu
- Ananya Saini (asaini434), as4341@scarletmail.rutgers.edu
- Brandon Wong (bwong04), bw442@scarletmail.rutgers.edu

## Documentation
Google Drive Folder: https://drive.google.com/drive/folders/13dgBehoeFSqMGnRPW4FxY-40sX2UYfkJ?usp=sharing <br>

**Reports** <br>
Report 1: https://docs.google.com/document/d/1SQ4U3aqSeCbGwdlG3JkmcBZvJ6RWVdL69lMOfdHNH_Q/edit?usp=sharing <br>
Report 2: https://docs.google.com/document/d/1UCVDy13D2jpGkfyDUPKDutIXdnd_qsWcaZ50DXF0_ZQ/edit?usp=sharing <br>
Final Report: https://docs.google.com/document/d/1OlsQdqfVmf6LggvxJ5Nm0i11gqobzuDgZS2bMRjhbHU/edit?usp=sharing <br>

**Presentations** <br>
Proposal Presentation: https://docs.google.com/presentation/d/10ElvcHoIKxHPzkxvxk6Ds9BC0xcwzBqx72maPep5I-c/edit?usp=sharing <br>
Midterm Presentation: https://docs.google.com/presentation/d/1UhAvreUZgSsisrweDlk0owGnd3_khudw1BCXwJA7oFc/edit?usp=sharing <br>
Final Presentation: https://docs.google.com/presentation/d/1AUPAvjD9Zk48ClsjgmWBNBaaXd9uhr1PdYuaPqU4P3c/edit?usp=sharing <br>

## Project Overview
RU My Roommate is a preference-based smart matchmaking platform for Rutgers students aimed to facilitate connections and find compatible roommates. <br>

### Goals
- **Improve student experience**: Compatible roommates reduce conflicts and ensure they feel comfortable in their living situations.
- **Making Meaningful Connections**: Meet and connect with their roommates beforehand, helping them build friendships before moving in together.
- **Satisfaction**: A positive living environment leads to better mental well-being, which leads to a positive impact on academic performance and overall student satisfaction.
- **Safety and Security**: Verifies student identity through Rutgers NetID login, preventing unauthorized users and scammers from accessing the platform
- **Accessible, and easy-to-use interface**: Allows all users to access information and utilize our services effectively and efficiently.
- **Personalized feed**: Improves user experience and will allow efficient and easy contact between users posting & interested users

### Development Team
**Account/Profile Page** <br>
Developers: Brandon, Jaron, Kayla <br>
Goals: Obtain user information & store user data to improve user experience <br>
Data used: User Credentials, User Preferences <br>

**Main/Feed Page** <br>
Developers: Vlad, Cameron, Miguel <br>
Goals: Create a personalized, informative, & easy to use feed that will allow easy contact between users posting & interested users <br>
Data used: User Credentials, User Preferences, Matching Notifications <br>

**Inquiry/Posting Page** <br>
Developers: Mariana, Ananya <br>
Goals: Create an easy-to-use categorical input page that requires certain fields of information that will be posted on the feed <br>
Data used: User Preferences <br>

### Data Collections
- **DC-01**: User Accounts <br> The registration information for each authenticated user of the application, including their Rutgers Net IDs <br> 
- **DC-02**: User Preferences <br> The preferences for a user’s desired roommate, including a variety of populated data as described in the Data Attributes section <br>
- **DC-03**: Created Roommate Listings <br> The visual posts of a user that appear in the main page and which is customized by their preferences for other users to filer <br>
- **DC-04**: Saved Roommate Listings <br> The roommate listings of a user that they store and view for indirect interaction through contacts <br>
- **DC-05**: Matching Notifications <br> The notifications that is shown to a user for any posts that have posted preferences that match with one of the user’s preferences <br>

### Data Operations
- **OP-01**: Get Account <br> The user retrieves an account that uniquely identifies them in the system
- **OP-02**: Create Account <br> The user creates an account and stores the account information in the system
- **OP-03**: Get Preference <br> The user retrieves their preference of a particular field
- **OP-04**: Set Preference <br> The user sets the preference of a particular field to a value that they want to share with other users
- **OP-05**: Get Listings <br> The user retrieves the roommate listings that they created
- **OP-06**: Create Listing <br> The user creates a roommate listing and stores the listing information in the system
- **OP-07**: Remove Listing <br> The user removes a roommate listing from the system
- **OP-08**: Get Saved Listings <br> The user gets their saved roommate listings of other users that they saved
- **OP-09**: Add Saved Listing <br> The user adds a roommate listing from another user for later use
- **OP-10**: Remove Saved Listing <br> The user removes a roommate listing from their saved list for later use
- **OP-11**: Get Notifications <br> The user retrieves notifications that a roommate listing of another user has matching preferences to their own

### Business Policies
- **BSP-01**: At most five roommate listings of any type of filtering can be displayed on the main page.
- **BSP-02**: If there is no filter applied to display roommate listings, choose the recently created ones.
- **BSP-03**: Created roommate listings can be filtered based on the user's current preferences.
- **BSP-04**: Users have the option to not input their preferences to respect their privacy.
- **BSP-05**: Users can only create at most five roommate listings at a time.
- **BSP-06**: At most five matching notifications are viewable on display in the main page.
- **BSP-07**: Choose which preferences can be used for viewable matching notifications
- **BSP-08**: Any matching notifications are added or removed from all users upon a user’s changed preferences.
- **BSP-09**: Users have an option to not update their roommate listings upon their changed preferences.
- **BSP-10**: Visitors can view, but not query roommate listings of other authenticated users.

## Github Overview



