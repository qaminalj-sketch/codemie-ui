Feature: Work Item Management

Scenario: Create a work item
Given I am on the work items page
When I create a new work item with a title and priority
Then it should appear in the work items list

Scenario: Filter work items by priority
Given multiple work items exist with different priorities
When I filter by "High" priority
Then only high priority items should be shown
