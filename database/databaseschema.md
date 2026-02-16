**User Account**
- * user id
- net id
- user name
- real name
- age

**Users Preferences**
- * user id

preference ids as shown below
- 00 reserved for null

Primary
- 01 gender
- 02 major

Categorical
- 03 race preference
- 04 religion preference
- 05 smoking preference
- 06 drinking preference
- 07 sleeping habits

Numerical
- 08 room budget
- 09 start sleep time
- 10 end sleep time
- 11 study start time
- 12 study end time
- 13 shared space start time
- 14 shared space end time
- 15 preferred low temperature
- 16 preferred high temperature
- 17 preferred guest frequency
- 18 cleanliness scale
- 19 noise tolerance scale

**Created Roommate Listings**
- * post id
- user id
- address
- campus
- house type
- number of rooms
- number of bathrooms
- number of roommates
- preferences ids
- description

**Saved Roommates Listings**
- * save id
- user id
- post id

**Matching Notifications**
- * notification id
- user id
- post id
