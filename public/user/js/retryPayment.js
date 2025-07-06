

async function retryPayment({ amount, selectedAddressId, key }) {
    try {

      const res = await fetch('/user/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, selectedAddressId }),
      });

      const data = await res.json();
      if (!data.success) {
        Swal.fire('Error', "Failed to create Razorpay order.", 'error');
        return;
      }

      const options = {
        key: key,
        amount: data.order.amount,
        currency: "INR",
        name: "HAMD SOFAS",
        order_id: data.order.id,

        handler: async function (response) {
          try {
            const verifyRes = await fetch('/user/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const result = await verifyRes.json();
            if (result.success) {
              window.location.href = `/user/order-success/${result.customId}`;
            } else {
              window.location.href = `/user/order-failure/${result.customId}`;
            }
          } catch (err) {
            console.error("Verification error:", err);
            window.location.href = `/user/order-failure`;
          }
        }
      };

      const rzp = new Razorpay(options);

      rzp.open();

    } catch (error) {
      console.error("Retry Error:", error);
      Swal.fire('Error', "Something went wrong. Try again.", 'error');
    }
  }