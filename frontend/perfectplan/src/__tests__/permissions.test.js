import { render, screen } from "@testing-library/react";
import App from "../App";

test("guest does not see create event button", () => {
  render(<App />);

  expect(
    screen.queryByText(/Create Event/i)
  ).not.toBeInTheDocument();
});
