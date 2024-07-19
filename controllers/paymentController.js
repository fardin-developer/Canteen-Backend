const paymentSave = async (req, res) => {
    const { payment } = req.body;
    console.log(payment);
}

module.exports = {paymentSave}