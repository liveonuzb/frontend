import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useTelegramMainButton,
  useTelegramSecondaryButton,
} from "./use-telegram-buttons.js";

const createButton = () => ({
  setText: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  showProgress: vi.fn(),
  hideProgress: vi.fn(),
  onClick: vi.fn(),
  offClick: vi.fn(),
});

describe("Telegram Mini App buttons", () => {
  beforeEach(() => {
    delete window.Telegram;
  });

  it("binds the Telegram MainButton as the primary submit action", () => {
    const onClick = vi.fn();
    const mainButton = createButton();
    window.Telegram = {
      WebApp: {
        initData: "signed-init-data",
        MainButton: mainButton,
      },
    };

    const Component = () => {
      useTelegramMainButton({
        text: "Saqlash",
        isVisible: true,
        isEnabled: true,
        isLoading: false,
        onClick,
      });
      return null;
    };

    const { unmount } = render(<Component />);

    expect(mainButton.setText).toHaveBeenCalledWith("Saqlash");
    expect(mainButton.enable).toHaveBeenCalledTimes(1);
    expect(mainButton.hideProgress).toHaveBeenCalledTimes(1);
    expect(mainButton.show).toHaveBeenCalledTimes(1);
    expect(mainButton.onClick).toHaveBeenCalledWith(onClick);

    unmount();

    expect(mainButton.offClick).toHaveBeenCalledWith(onClick);
    expect(mainButton.hide).toHaveBeenCalledTimes(1);
  });

  it("binds Telegram SecondaryButton for cancel/back actions", () => {
    const onClick = vi.fn();
    const secondaryButton = createButton();
    window.Telegram = {
      WebApp: {
        initData: "signed-init-data",
        SecondaryButton: secondaryButton,
      },
    };

    const Component = () => {
      useTelegramSecondaryButton({
        text: "Bekor qilish",
        isVisible: true,
        isEnabled: false,
        isLoading: true,
        onClick,
      });
      return null;
    };

    render(<Component />);

    expect(secondaryButton.setText).toHaveBeenCalledWith("Bekor qilish");
    expect(secondaryButton.disable).toHaveBeenCalledTimes(1);
    expect(secondaryButton.showProgress).toHaveBeenCalledTimes(1);
    expect(secondaryButton.show).toHaveBeenCalledTimes(1);
    expect(secondaryButton.onClick).toHaveBeenCalledWith(onClick);
  });
});
