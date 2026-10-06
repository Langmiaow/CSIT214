# 11. Change Management

## 11.1 Change Management Approach

Change management is used to ensure that changes to the approved project baseline are controlled, assessed and documented before implementation. During the Community Facility and Maintenance Management System project, changes may arise from new client requirements, design improvements, technical limitations, testing results or issues identified during development.

The purpose of the change-management process is to prevent uncontrolled scope expansion and to ensure that the impact of a proposed change is understood before the project team begins implementation.

Minor corrections that do not materially affect the approved scope, schedule, cost or major deliverables may be handled through normal project control. However, significant changes must be formally documented, analysed and approved before implementation.

The project follows the change-control sequence below:

**Change Request → Impact Analysis → Recommendation → Client Decision → Artefact Update → Implementation and Testing → Verification and Closure**

## 11.2 Change Impact Assessment

When a change request is received, the project team assesses its possible impact across the following areas:

| Impact Area | Assessment Consideration |
|---|---|
| Scope | Whether requirements, project inclusions, exclusions or acceptance criteria are affected. |
| Schedule | Whether task durations, dependencies, milestones or the final completion date will change. |
| Cost | Whether additional professional effort or other project expenditure is required. |
| Resources | Whether different or additional project resources are required. |
| Risk | Whether the proposed change introduces new risks or changes existing risk exposure. |
| Quality | Whether expected system behaviour, validation or acceptance expectations will change. |
| Design / Prototype | Whether the user interface, workflow, data structure or implemented functionality must be modified. |
| Testing | Whether existing test cases need to be changed or additional tests must be created. |

## 11.3 Change Control Procedure

When a change request is submitted, the project team first records the requested change, the reason for the change and the stakeholder who requested it.

The team then performs an impact analysis across scope, schedule, cost, resources, risk, quality, system design and testing requirements.

Based on the impact analysis, the project team prepares a recommendation. The authorised client representative or project decision-maker then decides whether the change should be approved, rejected or deferred.

If the change is approved, all affected project artefacts are updated. Depending on the nature of the change, this may include:

- functional and non-functional requirements;
- project scope;
- acceptance criteria;
- Work Breakdown Structure;
- ProjectLibre schedule;
- cost estimates;
- risk register;
- system and interface design;
- prototype code; and
- test cases.

After implementation, the change is tested to confirm that the modified function works correctly and does not create unacceptable problems in existing system functions. The change is then verified and formally closed.

## 11.4 Client Change Request

### Change Request CR-01

| Item | Details |
|---|---|
| Change Request ID | CR-01 |
| Change Title | Add Booking Reference Number |
| Requested By | Client Representative |
| Requested Change | Generate and display a unique booking reference number when a booking request is successfully submitted. |
| Reason for Change | The booking reference number makes individual bookings easier for community users and Council staff to identify and track. |
| Scope Impact | Low. The change adds a small function to the booking confirmation process. |
| Schedule Impact | Minor additional implementation and testing effort is required. |
| Cost Impact | Low. No additional software or infrastructure cost is expected. |
| Resource Impact | Existing development and testing resources can complete the change. |
| Risk Impact | Low. Incorrect or duplicate reference numbers may create booking-tracking issues. |
| Design Impact | The booking confirmation page must display the generated booking reference number. |
| Testing Impact | A new test case is required to confirm that each successful booking receives a valid and unique reference number. |
| Recommendation | Approve |
| Decision | Approved |
| Status | Implemented and Tested |

## 11.5 Change Request Evaluation

CR-01 was reviewed using the formal change-management process. The requested function was considered useful because it improves the ability of users and Council staff to identify individual booking requests.

The impact analysis showed that the change had only a minor effect on the approved project scope and schedule. It did not require additional software infrastructure or major changes to the existing booking workflow. Therefore, the change was recommended for approval.

After approval, the booking confirmation design and relevant prototype function were updated. A new test case was also added to verify that a valid and unique booking reference number was generated for each successful booking. After successful testing, the change request was verified and closed.

## 11.6 Change Management Summary

The change-management process provides a clear and traceable method for handling project changes. It ensures that significant changes are not implemented informally and that their effects on scope, schedule, cost, risk, design and testing are considered before approval. This helps the project team maintain consistency between the approved project baseline, project documentation and the final prototype.
