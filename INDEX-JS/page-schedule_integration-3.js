
    // Initialize jsConfetti
    const jsConfetti = new JSConfetti();

    // Add click event listeners to all buttons
    document.querySelectorAll('.submit').forEach(button => {
      button.addEventListener('click', () => {
        // Retrieve the emoji from the data-emoji attribute of the clicked button
        const emoji = button.getAttribute('data-emoji');
        // Trigger the confetti with the specific emoji
        jsConfetti.addConfetti({
          emojis: [emoji], // Use the emoji as confetti
          emojiSize: 70,
          confettiNumber: 40, // Number of confetti particles
        });
      });
    });
  