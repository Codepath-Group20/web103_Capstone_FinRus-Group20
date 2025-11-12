# Milestone 3

This document should be completed and submitted during **Unit 7** of this course. You **must** check off all completed tasks in this document in order to receive credit for your work.

## Checklist

This unit, be sure to complete all tasks listed below. To complete a task, place an `x` between the brackets.

You will need to reference the GitHub Project Management guide in the course portal for more information about how to complete each of these steps.

- [ x] In your repo, create a project board. 
  - *Please be sure to share your project board with the grading team's GitHub **codepathreview**. This is separate from your repository's sharing settings.*
- [ x] In your repo, create at least 5 issues from the features on your feature list.
- [ X] In your repo, update the status of issues in your project board.
- [ X]In your repo, create a GitHub Milestone for each final project unit, corresponding to each of the 5 milestones in your `milestones/` directory. 
  - [ X] Set the completion percentage of each milestone. The GitHub Milestone for this unit (Milestone 3 - Unit 7) should be 100% completed when you submit for full points.
- [ ] In `readme.md`, check off the features you have completed in this unit by adding a ✅ emoji in front of the feature's name.
  - [ ] Under each feature you have completed, include a GIF showing feature functionality.
- [ ] In this documents, complete all five questions in the **Reflection** section below.

## Reflection

### 1. What went well during this unit?

During this unit, we successfully established our project management infrastructure on GitHub. We created a comprehensive project board, documented 5+ feature-based issues covering core functionality like the backtesting engine, portfolio management, and strategy visualization. We also organized our development milestones to align with the course schedule. Our team made solid progress on the backend architecture, implementing the Express.js server structure with modular controllers and services for backtesting, portfolio, and strategy management. The basic routing and database schema setup were completed successfully.

### 2. What were some challenges your group faced in this unit?

One of our main challenges was integrating the Python-based historical data API (YahooData.py) with our Node.js backend. We encountered import resolution errors in our Jupyter notebook testing environment, which slowed down our data pipeline development. Additionally, coordinating work across frontend (React), backend (Node.js/Express), and data services (Python) required careful planning to avoid merge conflicts. Time zone differences and scheduling group meetings continued to be a coordination challenge, making synchronous collaboration difficult at times.

### Did you finish all of your tasks in your sprint plan for this week? If you did not finish all of the planned tasks, how would you prioritize the remaining tasks on your list?

We completed most of our planned tasks for project setup and infrastructure, including the GitHub project board, issues, and milestones. However, we fell behind on some core feature implementations, particularly the real-time data integration and complete frontend-backend connection for the portfolio management system. Moving forward, we would prioritize: (1) completing the backtesting engine with accurate historical data integration, as this is our core feature; (2) fixing the Python-Node.js data pipeline to ensure reliable data flow; (3) implementing the portfolio tracking functionality with database persistence; and (4) adding visual analytics (charts/graphs) for strategy performance, as this enhances user experience significantly.

### Which features and user stories would you consider "at risk"? How will you change your plan if those items remain "at risk"?

The real-time portfolio valuation feature (User Story 8) is at risk due to API integration complexity and potential rate limiting from data providers. The multi-timeframe backtesting across different symbols (User Story 3) is also at risk because it requires significant computational resources and optimized data handling. If these remain at risk, our mitigation plan includes: implementing a demo mode with synthetic/cached data for real-time features, focusing first on single-symbol backtesting with the most popular stocks (AAPL, MSFT, GOOGL), and creating a robust fallback mechanism that displays the last known good data when live data is unavailable. We'll ensure core functionality works with limited data before scaling to comprehensive coverage.

### 5. What additional support will you need in upcoming units as you continue to work on your final project?

We would benefit from additional guidance on: (1) best practices for integrating Python microservices with Node.js backends, particularly around data serialization and error handling between the two environments; (2) strategies for handling asynchronous data fetching and caching mechanisms to improve performance when dealing with large historical datasets; (3) deployment considerations for applications that combine multiple tech stacks (React, Node.js, Python, PostgreSQL); and (4) testing strategies for financial calculations to ensure accuracy and reliability, especially for metrics like Sharpe ratio and maximum drawdown that are critical for user trust.