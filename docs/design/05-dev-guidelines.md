# 05. Dev Guidelines

Idlefinder Development Guidelines (POC/MVP)
These guidelines define how to develop the Idlefinder prototype effectively when most implementation
work is performed by AI tools under the supervision of a human product owner. They draw on best practices
for software design and documentation, emphasising clarity and consistency rather than heavy process. A
lightweight but documented process improves communication and planning 1 and ensures the prototype
can evolve smoothly.

1. Documentation & Decision Log
- Design Documents First – Begin each feature by updating the relevant design documents (game design, architecture, data, API specification). Documenting decisions up front improves alignment

and provides context for AI tools to generate code 1 .

- Decision Log – Keep a simple log (e.g., docs/decisions.md ) noting key architectural or gameplay decisions. For each entry, record the decision, the options considered and the rationale. This follows

the spirit of Architecture Decision Records (ADRs), which capture important choices and aid future
maintainers 2 .

- Version Control – Use Git branches to isolate features or experiments. Even though our GitHub access is read‑only in this environment, mirror the pattern locally and when pushing to remote later.

Commit frequently with descriptive messages.

2. Development Process
- Feature Breakdown – Before coding, break each milestone (as defined in the game design document) into discrete tasks. For each task, specify inputs, outputs and acceptance criteria. This

helps the AI tool produce targeted implementations.

- Incremental Implementation – Implement features iteratively. For example, implement mission assignment without rewards, test it, then add reward distribution. This reduces complexity and

clarifies the role of each subsystem.

- Test Harness – Write small unit tests around the message bus and domain logic. The test harness should simulate commands and verify that the correct events are emitted. Automated tests enable

safe refactoring and are part of a robust design document practice 3 .

- Error Handling & Recovery – Ensure that each command handler validates preconditions and emits

CommandFailed events on errors. Document typical failure scenarios and recovery steps.
Document360 notes that including error handling and recovery in design docs prevents crashes and
improves robustness 4 .

3. Collaboration Between Human and AI
- Prompt Clarity – Provide clear and complete instructions when invoking AI tools. Include relevant design context and desired outcomes. Use explicit examples of commands and events where helpful.

- Review & Feedback – After the AI produces code, review it manually. Check that it aligns with the design documents, handles edge cases and respects the data model. Provide feedback to refine

subsequent generations.

- Continuous Learning – When unexpected behaviour occurs, update the design or guidelines to reflect new understanding. This iterative approach is central to process‑based documentation 3 .

4. Minimal Testing & Acceptance Criteria

For the MVP, each subsystem should satisfy the following acceptance criteria:

1. Command Bus – Dispatching a command produces exactly one domain event or a

CommandFailed event. Unhandled commands are logged and do not crash the app.

2. Mission System – Missions progress over time based on tick messages. When a mission is complete, it emits a MissionCompleted event with rewards matching the mission definition.
3. Persistence – Player state saves to local storage after significant events and reloads correctly on refresh. Offline catch‑up uses the stored timestamp to process elapsed ticks.
4. Adventurer Management – Recruiting and retiring adventurers updates the roster and persists correctly. Adventurers cannot be assigned to multiple missions simultaneously.
5. UI Responsiveness – The UI updates reactively to domain events (e.g., progress bars tick down, resources increment). Error messages from CommandFailed events are displayed to the player.

When each criterion passes, consider the feature “done” for the POC.

5. Future Extensions

These guidelines are deliberately lightweight to support rapid prototyping. As the project moves beyond the
POC stage and additional collaborators join, consider documenting:

- Coding Standards – Define language‑specific style guides and review practices.
- Continuous Integration/Delivery – Automate builds, tests and deployments using CI/CD pipelines.
- Security and Performance – Conduct threat modelling and performance testing. TechTarget emphasises that security design should be integrated early in the development lifecycle 5 , but for

the MVP we focus on functional correctness.

- Player Onboarding and Support – Document onboarding flows and user guides as the game becomes publicly available.

By following these guidelines, you and your AI tools can build the Idlefinder prototype systematically,
maintain clear communication and set the stage for future growth.

1 Software Design Document [Tips & Best Practices] | The Workstream
https://www.atlassian.com/work-management/knowledge-sharing/documentation/software-design-document

2 Architecture Decision Record: How And Why Use ADRs? - Scrum-Master·Org
https://scrum-master.org/en/architecture-decision-record-how-and-why-use-adrs/

3 Technical Documentation in Software Development: Types and Best Practices
https://distantjob.com/blog/software-technical-documentation/

4 Creating a Software Design Document (SDD): What you need to know
https://document360.com/blog/software-design-document/

5 What is threat modeling? | Definition from TechTarget
https://www.techtarget.com/searchsecurity/definition/threat-modeling

