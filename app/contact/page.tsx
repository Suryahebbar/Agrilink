'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, Users } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f0de] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#1f3b2c] mb-6">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl text-[#4b5563] max-w-3xl mx-auto mb-8">
              We're here to help you transform your farming experience. Reach out to us with any questions, feedback, or partnership opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Email Us</h3>
            <p className="text-[#4b5563] mb-2">bhuvanbn01@gmail.com</p>
            <p className="text-[#4b5563]">support@agrlink.com</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Call Us</h3>
            <p className="text-[#4b5563] mb-2">7090869356</p>
            <p className="text-[#4b5563]">Mon-Fri: 9AM-6PM IST</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Visit Us</h3>
            <p className="text-[#4b5563] mb-2">AgriLink HQ</p>
            <p className="text-[#4b5563]">Mysuru, Karnataka 570001</p>
          </div>
        </div>

        {/* Contact Form and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-[#1f3b2c] mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-transparent text-gray-900"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  Something went wrong. Please try again later.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#166534] to-[#15803d] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-3xl font-bold text-[#1f3b2c] mb-6">How We Can Help</h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Product Support</h3>
                    <p className="text-[#4b5563]">
                      Get help with platform features, technical issues, or learn how to make the most of AgriLink's tools.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Partnership Opportunities</h3>
                    <p className="text-[#4b5563]">
                      Explore collaboration opportunities, API integrations, or becoming a certified AgriLink partner.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Response Time</h3>
                    <p className="text-[#4b5563]">
                      We typically respond within 24 hours during business days. For urgent matters, call us directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="mt-8 bg-[#f0fdf4] p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-4">Office Hours</h3>
              <div className="space-y-2 text-[#4b5563]">
                <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM IST</p>
                <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM IST</p>
                <p><strong>Sunday:</strong> Closed</p>
              </div>
              <p className="text-sm text-[#4b5563] mt-4">
                Emergency support available 24/7 for critical platform issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[#f0fdf4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">
                How do I get started with AgriLink?
              </h3>
              <p className="text-[#4b5563]">
                Simply sign up for a free account, complete your profile, and start exploring our platform features. We offer guided onboarding for new users.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">
                Is there a mobile app available?
              </h3>
              <p className="text-[#4b5563]">
                Yes! Our mobile app is available for both Android and iOS devices. Download it from the Google Play Store or Apple App Store.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">
                What kind of support do you offer?
              </h3>
              <p className="text-[#4b5563]">
                We provide 24/7 email support, business hours phone support, and extensive documentation including video tutorials and guides.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">
                Can I integrate AgriLink with my existing systems?
              </h3>
              <p className="text-[#4b5563]">
                Yes, we offer API access and integration support. Contact our partnerships team to discuss your specific requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
