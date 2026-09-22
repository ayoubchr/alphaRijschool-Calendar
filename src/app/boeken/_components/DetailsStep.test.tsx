import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DetailsStep } from "./DetailsStep";

afterEach(() => {
  cleanup();
});

describe("DetailsStep", () => {
  it("submits the filled-in details when the register number is not required", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DetailsStep requiresNationalRegisterNumber={false} onSubmit={onSubmit} onBack={vi.fn()} />);

    const form = container.querySelector("form");
    const inputs = form?.querySelectorAll("input");
    const submitButton = form?.querySelector("button[type='submit']");

    fireEvent.change(inputs![0], { target: { value: "Jan" } }); // firstName
    fireEvent.change(inputs![1], { target: { value: "Jansen" } }); // lastName
    fireEvent.change(inputs![2], { target: { value: "jan@example.com" } }); // email
    fireEvent.change(inputs![3], { target: { value: "0470000000" } }); // phone
    fireEvent.change(inputs![4], { target: { value: "Straat 1" } }); // address
    fireEvent.change(inputs![5], { target: { value: "2000-01-01" } }); // dateOfBirth

    fireEvent.click(submitButton!);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Jan", email: "jan@example.com" }));
  });

  it("blocks submission when the register number is required but empty", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DetailsStep requiresNationalRegisterNumber={true} onSubmit={onSubmit} onBack={vi.fn()} />);

    const form = container.querySelector("form");
    const inputs = form?.querySelectorAll("input");
    const submitButton = form?.querySelector("button[type='submit']");

    fireEvent.change(inputs![0], { target: { value: "Jan" } }); // firstName
    fireEvent.change(inputs![1], { target: { value: "Jansen" } }); // lastName
    fireEvent.change(inputs![2], { target: { value: "jan@example.com" } }); // email
    fireEvent.change(inputs![3], { target: { value: "0470000000" } }); // phone
    fireEvent.change(inputs![4], { target: { value: "Straat 1" } }); // address
    fireEvent.change(inputs![5], { target: { value: "2000-01-01" } }); // dateOfBirth

    fireEvent.click(submitButton!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Rijksregisternummer is verplicht/)).toBeInTheDocument();
  });

  it("blocks submission when the register number does not reduce to 11 digits", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DetailsStep requiresNationalRegisterNumber={true} onSubmit={onSubmit} onBack={vi.fn()} />);

    const form = container.querySelector("form");
    const inputs = form?.querySelectorAll("input");
    const submitButton = form?.querySelector("button[type='submit']");

    fireEvent.change(inputs![0], { target: { value: "Jan" } }); // firstName
    fireEvent.change(inputs![1], { target: { value: "Jansen" } }); // lastName
    fireEvent.change(inputs![2], { target: { value: "jan@example.com" } }); // email
    fireEvent.change(inputs![3], { target: { value: "0470000000" } }); // phone
    fireEvent.change(inputs![4], { target: { value: "Straat 1" } }); // address
    fireEvent.change(inputs![5], { target: { value: "2000-01-01" } }); // dateOfBirth
    fireEvent.change(inputs![6], { target: { value: "12345" } }); // nationalRegisterNumber

    fireEvent.click(submitButton!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/11 cijfers/)).toBeInTheDocument();
  });

  it("accepts a register number formatted with dots and dashes", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DetailsStep requiresNationalRegisterNumber={true} onSubmit={onSubmit} onBack={vi.fn()} />);

    const form = container.querySelector("form");
    const inputs = form?.querySelectorAll("input");
    const submitButton = form?.querySelector("button[type='submit']");

    fireEvent.change(inputs![0], { target: { value: "Jan" } }); // firstName
    fireEvent.change(inputs![1], { target: { value: "Jansen" } }); // lastName
    fireEvent.change(inputs![2], { target: { value: "jan@example.com" } }); // email
    fireEvent.change(inputs![3], { target: { value: "0470000000" } }); // phone
    fireEvent.change(inputs![4], { target: { value: "Straat 1" } }); // address
    fireEvent.change(inputs![5], { target: { value: "2000-01-01" } }); // dateOfBirth
    fireEvent.change(inputs![6], { target: { value: "85.07.30-033.28" } }); // nationalRegisterNumber

    fireEvent.click(submitButton!);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ nationalRegisterNumber: "85.07.30-033.28" }));
  });
});
