const pool = require("./db")

module.exports = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber required" })
    }

    // Find existing contacts
    const result = await pool.query(
      `SELECT * FROM contact
       WHERE ($1::text IS NOT NULL AND email=$1)
       OR ($2::text IS NOT NULL AND phonenumber=$2)`,
      [email || null, phoneNumber || null]
    )

    let contacts = result.rows

    // If no contact exists → create primary
    if (contacts.length === 0) {
      const newContact = await pool.query(
        `INSERT INTO contact(email, phonenumber, linkprecedence)
         VALUES($1,$2,'primary')
         RETURNING *`,
        [email || null, phoneNumber || null]
      )

      const contact = newContact.rows[0]

      return res.json({
        contact: {
          primaryContactId: contact.id,
          emails: contact.email ? [contact.email] : [],
          phoneNumbers: contact.phonenumber ? [contact.phonenumber] : [],
          secondaryContactIds: []
        }
      })
    }

    // Find primary contact
    let primary = contacts.find(c => c.linkprecedence === "primary") || contacts[0]

    if (primary.linkedid) {
      const primaryResult = await pool.query(
        `SELECT * FROM contact WHERE id=$1`,
        [primary.linkedid]
      )
      primary = primaryResult.rows[0]
    }

    // Check existing data
    const emailExists = contacts.some(c => c.email === email)
    const phoneExists = contacts.some(c => c.phonenumber === phoneNumber)

    // Create secondary if new info
    if ((email && !emailExists) || (phoneNumber && !phoneExists)) {
      await pool.query(
        `INSERT INTO contact(email, phonenumber, linkprecedence, linkedid)
         VALUES($1,$2,'secondary',$3)`,
        [email || null, phoneNumber || null, primary.id]
      )
    }

    // Get all linked contacts
    const linked = await pool.query(
      `SELECT * FROM contact
       WHERE id=$1 OR linkedid=$1`,
      [primary.id]
    )

    const rows = linked.rows

    const emails = [
      ...new Set(
        rows
          .map(r => r.email)
          .filter(e => e !== null && e !== "")
      )
    ]

    const phones = [
      ...new Set(
        rows
          .map(r => r.phonenumber)
          .filter(p => p !== null && p !== "")
      )
    ]

    const secondaryIds = rows
      .filter(r => r.linkprecedence === "secondary")
      .map(r => r.id)

    res.json({
      contact: {
        primaryContactId: primary.id,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}