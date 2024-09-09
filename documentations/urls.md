# Proposed Endpoints

Incase of any missed endpoint or any redundant on, feel free to create a pull request for it.

### 1. Users

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

- [ ] **Create User**

  - **Method:** POST
  - **Path:** `/users/`
  - **Description:** Create a new user.
  - **Role:** Public

- [ ] **Update User**

  - **Method:** PUT
  - **Path:** `/users/{id}/`
  - **Description:** Update details of a specific user.
  - **Role:** Admin or the User themselves(But only admins can update role)

- [ ] **Delete User**
  - **Method:** DELETE
  - **Path:** `/users/{id}/`
  - **Description:** Delete a specific user.
  - **Role:** Admin

### 2. Blog Posts

- [ ] **Get Blog Posts**

  - **Method:** GET
  - **Path:** `/blog/posts/`
  - **Description:** Retrieve a list of blog posts.
  - **Role:** Public

- [ ] **Get Blog Post Details**

  - **Method:** GET
  - **Path:** `/blog/posts/{id}/`
  - **Description:** Retrieve details of a specific blog post and its Authors.
  - **Role:** Public

- [ ] **Create Blog Post**

  - **Method:** POST
  - **Path:** `/blog/posts/`
  - **Description:** Create a new blog post.
  - **Role:** Admin or Writer

- [ ] **Update Blog Post**

  - **Method:** PUT
  - **Path:** `/blog/posts/{id}/`
  - **Description:** Update details of a specific blog post.
  - **Role:** Admin or Writer

- [ ] **Delete Blog Post**
  - **Method:** DELETE
  - **Path:** `/blog/posts/{id}/`
  - **Description:** Delete a specific blog post.
  - **Role:** Admin or Writer

### 3. Blog Authors

- [ ] **Create Blog Author**

  - **Method:** POST
  - **Path:** `/blog/authors/`
  - **Description:** Create a new blog author.
  - **Role:** Admin or Writer

- [ ] **Update Blog Author**

  - **Method:** PUT
  - **Path:** `/blog/authors/{id}/`
  - **Description:** Update details of a specific blog author.
  - **Role:** Admin or Writer

- [ ] **Delete Blog Author**
  - **Method:** DELETE
  - **Path:** `/blog/authors/{id}/`
  - **Description:** Delete a specific blog author.
  - **Role:** Admin or Writer

### 4. Events

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

### 5. Event Cohosts

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

### 6. Hackathons

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

### 7. Hackathon Categories

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

### 8. Hackathon Schedule

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

### 9. Hackers

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

### 10. Teams

- [ ] **Get Teams**

  - **Method:** GET
  - **Path:** `/teams/`
  - **Description:** Retrieve a list of teams.
  - **Role:** Public

- [ ] **Get Team Details**

  - **Method:** GET
  - **Path:** `/teams/{id}/`
  - **Description:** Retrieve details of a specific team.
  - **Role:** Admin and Team members

- [ ] **Create Team**

  - **Method:** POST
  - **Path:** `/teams/`
  - **Description:** Create a new team.
  - **Role:** Hackers

- [ ] **Join Team**

  - **Method:** POST
  - **Path:** `/teams/join/{code}/`
  - **Description:** Join an existing team.
  - **Role:** Hackers not in team

- [ ] **Leave Team**

  - **Method:** POST
  - **Path:** `/teams/exit/{id}/`
  - **Description:** Leave a team.
  - **Role:** Hackers already in team

- [ ] **Update Team**

  - **Method:** PUT
  - **Path:** `/teams/{id}/`
  - **Description:** Update details of a specific team.
  - **Role:** Team Members

- [ ] **Delete Team**
  - **Method:** DELETE
  - **Path:** `/teams/{id}/`
  - **Description:** Delete a specific team.
  - **Role:** Admin and Team Admin

### 11. Submissions

- [ ] **Get Submissions**

  - **Method:** GET
  - **Path:** `/submissions/`
  - **Description:** Retrieve a list of submissions.
  - **Role:** Admin and Judges

- [ ] **Get Submission Details**

  - **Method:** GET
  - **Path:** `/submissions/{id}/`
  - **Description:** Retrieve details of a specific submission.
  - **Role:** Admin and Judges and Team members (from the team that submitted it)

- [ ] **Create Submission**

  - **Method:** POST
  - **Path:** `/submissions/`
  - **Description:** Create a new submission.
  - **Role:** Team members

- [ ] **Update Submission**

  - **Method:** PUT
  - **Path:** `/submissions/{id}/`
  - **Description:** Update details of a specific submission.
  - **Role:** Team members (for a limited time)

- [ ] **Delete Submission**
  - **Method:** DELETE
  - **Path:** `/submissions/{id}/`
  - **Description:** Delete a specific submission.
  - **Role:** Admin and Team Members

### 12. Submission Images

- [ ] **Create Submission Image**

  - **Method:** POST
  - **Path:** `/submission/images/`
  - **Description:** Upload a new image for a submission.
  - **Role:** Teams

- [ ] **Update Submission Image**

  - **Method:** PUT
  - **Path:** `/submission/images/{id}/`
  - **Description:** Update details of a specific submission image.
  - **Role:** Teams

- [ ] **Delete Submission Image**
  - **Method:** DELETE
  - **Path:** `/submission/images/{id}/`
  - **Description:** Delete a specific submission image.
  - **Role:** Admin and Teams

### 13. Event Gallery

- [ ] **Get Event Gallery**

  - **Method:** GET
  - **Path:** `/event/gallery/`
  - **Description:** Retrieve images and videos from events.
  - **Role:** Public

- [ ] **Get Event Gallery Details**

  - **Method:** GET
  - **Path:** `/event/gallery/{id}/`
  - **Description:** Retrieve details of a specific event gallery item.
  - **Role:** Public

- [ ] **Create Event Gallery Item**

  - **Method:** POST
  - **Path:** `/event/gallery/`
  - **Description:** Upload a new image or video to the event gallery.
  - **Role:** Admin or Events_admin

- [ ] **Update Event Gallery Item**

  - **Method:** PUT
  - **Path:** `/event/gallery/{id}/`
  - **Description:** Update details of a specific event gallery item.
  - **Role:** Admin or Events_admin

- [ ] **Delete Event Gallery Item**
  - **Method:** DELETE
  - **Path:** `/event/gallery/{id}/`
  - **Description:** Delete a specific event gallery item.
  - **Role:** Admin or Events_admin

### 14. Event Attendees

- [ ] **Get Event Attendees**

  - **Method:** GET
  - **Path:** `/event/attendees/`
  - **Description:** Retrieve a list of attendees for events.
  - **Role:** Admin

- [ ] **Get Event Attendee Details**

  - **Method:** GET
  - **Path:** `/event/attendees/{id}/`
  - **Description:** Retrieve details of a specific event attendee.
  - **Role:** Admin

- [ ] **Add Event Attendee**

  - **Method:** POST
  - **Path:** `/event/attendees/`
  - **Description:** Add a new attendee to an event.
  - **Role:** Admin

- [ ] **Remove Event Attendee**
  - **Method:** DELETE
  - **Path:** `/event/attendees/{id}/`
  - **Description:** Remove an attendee from an event.
  - **Role:** Admin
