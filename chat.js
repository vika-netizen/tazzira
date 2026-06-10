// AI endpoint
/* OPEN CHAT */
chatButton.addEventListener("click", () => {

  chatBox.classList.remove("hidden");

});

/* CLOSE CHAT */
closeChat.addEventListener("click", () => {

  chatBox.classList.add("hidden");

});
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ти AI-адміністратор фітнес клубу TAZIRRA.

Твої задачі:
- допомагати з вибором тренера
- пояснювати програми
- пропонувати запис
- відповідати коротко і дружньо
- якщо користувач хоче "зал" → підбирай тренера
- якщо "схуднути" → фітнес
- якщо "сила" → силові тренування
        `
        },
        {
          role: "user",
          content: userMessage
        }
      ],
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});

const chatButton =
document.getElementById("chat-button");

const chatBox =
document.getElementById("chat-box");

const closeChat =
document.getElementById("close-chat");

/* OPEN CHAT */

chatButton.addEventListener("click", () => {

  chatBox.classList.remove("hidden");

});

/* CLOSE CHAT */

closeChat.addEventListener("click", () => {

  chatBox.classList.add("hidden");

});