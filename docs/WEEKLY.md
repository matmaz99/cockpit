# Cockpit — weekly review

Appended every Monday.

## Week 1 · 26 Oct 2026 (day 1)
- Plan approved by the founder; repo `matmaz99/cockpit` created by him.
- Day 1 shipped: skeleton, Parksun design system, operator login, product registry, portfolio shell listing which data sources are connected.
- Day 2 shipped: read-only Blob reader (list and get only), adapters for Parksun (ev/ parts and merged day/ files) and the two static sites (one file per event), nested funnel, product page with Trafic, Entonnoir and Leads tabs. Verified on generated files in each store's exact layout: funnels 30/20/12/4 and 11/7/3/2/1 as expected, test lead excluded.
- Day 3 shipped: Portail DPE adapter on its own admin's SQL functions (admin_kpis, admin_daily, admin_funnel, admin_breakdown) so both screens agree; leads from dpe_leads with report and partner-dispatch status. Shapes checked against the live database through the Supabase connector: 20 to 26 Oct, 271 people checked a DPE, 26 leads, 0 purchases, lead_dispatches empty.
