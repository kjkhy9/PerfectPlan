import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

test("renders login screen after clicking login", () => {
  render(<App />);

  expect(screen.getByText(/welcome/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/login/i));


  expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
});
