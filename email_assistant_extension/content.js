console.log("Email writer extension - Content script loaded");

function findComposeToolbar() {
  const selectors = [".btC", ".aDh", '[role="toolbar"]', ".gU.Up"];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }
  return null;
}

function createAIButton() {
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3";
  button.style.marginRight = "8px";
  button.innerHTML = "AI Reply";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate AI Reply");
  return button;
}

function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    '[role="presentation"]',
    ".gU.Up",
  ];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content && content.innerText.trim()) {
      return content.innerText.trim();
    }
  }
  return "";
}

function injectButton() {
  const existingButton = document.querySelector(".ai-reply-button");
  if (existingButton) existingButton.remove();

  const toolBar = findComposeToolbar();
  if (!toolBar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar Found, creating AI button");
  const button = createAIButton();
  button.classList.add("ai-reply-button");

  button.addEventListener("click", async () => {
    try {
      button.innerHTML = "Generating...";
      button.disabled = true;

      const emailContent = getEmailContent();
      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: "professional",
        }),
      });

      if (!response.ok) throw new Error("API Request Failed");

      const genReply = await response.text();

      const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]'
      );

      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, genReply);
        // OR: composeBox.innerText = genReply;
      } else {
        console.error("Compose box was not found");
      }
    } catch (error) {
      console.error("Failed to generate reply", error);
      alert("Failed to generate reply");
    } finally {
      button.innerHTML = "AI Reply";
      button.disabled = false;
    }
  });

  toolBar.insertBefore(button, toolBar.firstChild);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposedElements = addedNodes.some((node) => {
      if (node instanceof Element) {
        return (
          node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]')
        );
      }
      return false;
    });

    if (hasComposedElements) {
      console.log("Compose Window detected");
      setTimeout(injectButton, 700);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
