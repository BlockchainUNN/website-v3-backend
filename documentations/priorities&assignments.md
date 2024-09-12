# Prioritzation and Assignment of Endpoints

### 1. Peter

- [ ] **Create User**

  - **Method:** POST
  - **Path:** `/users/`
  - **Description:** Create a new user.
  - **Role:** Public

- [ ] **Get Hackathons**

  - **Method:** GET
  - **Path:** `/hackathons/`
  - **Description:** Retrieve a list of hackathons.
  - **Role:** Public

- [ ] **Get Hackathon Details**

  - **Method:** GET
  - **Path:** `/hackathons/{id}/`
  - **Description:** Retrieve details of a specific hackathon.
  - **Role:** Public

- [ ] **Create Hackathon**

  - **Method:** POST
  - **Path:** `/hackathons/`
  - **Description:** Create a new hackathon.
  - **Role:** Admin or Events_admin

- [ ] **Update Hackathon**

  - **Method:** PUT
  - **Path:** `/hackathons/{id}/`
  - **Description:** Update details of a specific hackathon.
  - **Role:** Admin or Events_admin

- [ ] **Delete Hackathon**

  - **Method:** DELETE
  - **Path:** `/hackathons/{id}/`
  - **Description:** Delete a specific hackathon.
  - **Role:** Admin or Events_admin

- [ ] **Get Hackathon Categories**

  - **Method:** GET
  - **Path:** `/hackathon/categories/`
  - **Description:** Retrieve a list of categories for a hackathon.
  - **Role:** Public

- [ ] **Create Hackathon Category**

  - **Method:** POST
  - **Path:** `/hackathon/categories/`
  - **Description:** Create a new hackathon category.
  - **Role:** Admin or Events_admin

- [ ] **Update Hackathon Category**

  - **Method:** PUT
  - **Path:** `/hackathon/categories/{id}/`
  - **Description:** Update details of a specific hackathon category.
  - **Role:** Admin or Events_admin

- [ ] **Delete Hackathon Category**

  - **Method:** DELETE
  - **Path:** `/hackathon/categories/{id}/`
  - **Description:** Delete a specific hackathon category.
  - **Role:** Admin or Events_admin

- [ ] **Get Hackathon Schedule**

  - **Method:** GET
  - **Path:** `/hackathon/schedule/`
  - **Description:** Retrieve the schedule for a hackathon.
  - **Role:** Public

- [ ] **Create Hackathon Schedule Event**

  - **Method:** POST
  - **Path:** `/hackathon/schedule/`
  - **Description:** Create a new scheduled event for a hackathon.
  - **Role:** Admin or Events_admin

- [ ] **Update Hackathon Schedule Event**

  - **Method:** PUT
  - **Path:** `/hackathon/schedule/{id}/`
  - **Description:** Update details of a specific scheduled event.
  - **Role:** Admin or Events_admin

- [ ] **Delete Hackathon Schedule Event**
  - **Method:** DELETE
  - **Path:** `/hackathon/schedule/{id}/`
  - **Description:** Delete a specific scheduled event.
  - **Role:** Admin or Events_admin

### 2. Soluchi

- [ ] **Create Event**

  - **Method:** POST
  - **Path:** `/events/`
  - **Description:** Create a new event.
  - **Role:** Admin or Events_admin

- [ ] **Update Event**

  - **Method:** PUT
  - **Path:** `/events/{id}/`
  - **Description:** Update details of a specific event.
  - **Role:** Admin or Events_admin

- [ ] **Delete Event**

  - **Method:** DELETE
  - **Path:** `/events/{id}/`
  - **Description:** Delete a specific event.
  - **Role:** Admin or Events_admin

- [ ] **Create Event Cohost**

  - **Method:** POST
  - **Path:** `/event/cohosts/`
  - **Description:** Create a new event cohost.
  - **Role:** Admin or Events_admin

- [ ] **Update Event Cohost**

  - **Method:** PUT
  - **Path:** `/event/cohosts/{id}/`
  - **Description:** Update details of a specific event cohost.
  - **Role:** Admin or Events_admin

- [ ] **Delete Event Cohost**

  - **Method:** DELETE
  - **Path:** `/event/cohosts/{id}/`
  - **Description:** Delete a specific event cohost.
  - **Role:** Admin or Events_admin

- [ ] **Get Hackers**

  - **Method:** GET
  - **Path:** `/hackers/`
  - **Description:** Retrieve a list of hackers.
  - **Role:** Admin

- [ ] **Get Hacker Details**

  - **Method:** GET
  - **Path:** `/hackers/{id}/`
  - **Description:** Retrieve details of a specific hacker.
  - **Role:** Admin and Hacker

- [ ] **Create Hacker**

  - **Method:** POST
  - **Path:** `/hackers/`
  - **Description:** Create a new hacker. Takes password.
  - **Role:** Public

- [ ] **Update Hacker**

  - **Method:** PUT
  - **Path:** `/hackers/{id}/`
  - **Description:** Update details of a specific hacker.
  - **Role:** Admin and Hacker

- [ ] **Delete Hacker**
  - **Method:** DELETE
  - **Path:** `/hackers/{id}/`
  - **Description:** Delete a specific hacker.
  - **Role:** Admin and Hacker

### 3. Odoi

- [ ] **Get Users**

  - **Method:** GET
  - **Path:** `/users/`
  - **Description:** Retrieve a list of users.
  - **Role:** Admin

- [ ] **Get User Details**

  - **Method:** GET
  - **Path:** `/users/{id}/`
  - **Description:** Retrieve details of a specific user.
  - **Role:** Admin or the User themselves

- [ ] **Get Events**

  - **Method:** GET
  - **Path:** `/events/`
  - **Description:** Retrieve a list of events.
  - **Role:** Public

- [ ] **Get Event Details**

  - **Method:** GET
  - **Path:** `/events/{id}/`
  - **Description:** Retrieve details of a specific event, and it's cohosts.
  - **Role:** Public

- [ ] **Register for an Event**

  - **Method:** POST
  - **Path:** `/events/registeration/{id}/`
  - **Description:** Register for a specific event.
  - **Role:** Public

- [ ] **Unregister for an Event**

  - **Method:** POST
  - **Path:** `/events/unregister/{id}/`
  - **Description:** Unregister for a specific event.
  - **Role:** Public
