Feature: Shopping Cart Management

Scenario: Add product to cart
Given I am on the products page
When I click "Add to Cart" on a product
Then the product should appear in my cart
And the cart count should increase by 1

Scenario: Remove product from cart
Given I have a product in my cart
When I remove it from the cart
Then the cart should be empty

Scenario: View cart total
Given I have multiple products in my cart
When I view the cart page
Then I should see the correct total price
