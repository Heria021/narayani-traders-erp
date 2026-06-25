export default function ContactPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Contact Us</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Have a project in mind? We'd love to hear from you. Get in touch with us using the details below.
      </p>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-bold text-foreground">Email: </span>
          <span className="text-muted-foreground">contact@hariomstudio.com</span>
        </div>
        <div>
          <span className="font-bold text-foreground">Phone: </span>
          <span className="text-muted-foreground">+91 98765 43210</span>
        </div>
        <div>
          <span className="font-bold text-foreground">Office Address: </span>
          <span className="text-muted-foreground">Studio Chambers, Jaipur, Rajasthan, India</span>
        </div>
      </div>
    </div>
  )
}
