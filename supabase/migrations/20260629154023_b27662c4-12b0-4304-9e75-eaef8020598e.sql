
CREATE TABLE public.draft_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id uuid NOT NULL REFERENCES public.drafts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version_no integer NOT NULL,
  content text NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draft_versions TO authenticated;
GRANT ALL ON public.draft_versions TO service_role;
ALTER TABLE public.draft_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own draft versions" ON public.draft_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_draft_versions_draft ON public.draft_versions(draft_id, version_no DESC);

CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  doc_type text NOT NULL,
  title text NOT NULL,
  description text,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.templates TO authenticated, anon;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are publicly readable" ON public.templates
  FOR SELECT USING (true);

INSERT INTO public.templates (category, doc_type, title, description, body) VALUES
('Litigation', 'Bail Application', 'Regular Bail under Sec 480 BNSS', 'Standard regular bail application for the accused before the Sessions Court.', E'IN THE COURT OF THE LEARNED SESSIONS JUDGE AT [CITY]\n\nBail Application No. ____ of [YEAR]\nIn FIR No. [FIR NO]\nU/s [Sections of BNS] of the Bharatiya Nyaya Sanhita, 2023\nPolice Station: [P.S.]\n\n[Accused Name] ... Applicant/Accused\nVersus\nState of [State] ... Respondent\n\nAPPLICATION UNDER SECTION 480 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 FOR GRANT OF REGULAR BAIL\n\nMost Respectfully Showeth: ...'),
('Constitutional', 'Writ Petition', 'Article 226 Writ Petition (Mandamus)', 'Writ of mandamus before the High Court for enforcement of statutory duty.', E'IN THE HON''BLE HIGH COURT OF [STATE] AT [SEAT]\n\nW.P. (C) No. ____ of [YEAR]\n(Under Article 226 of the Constitution of India)\n\n[Petitioner] ... Petitioner\nVersus\n[Respondent / State / Authority] ... Respondents\n\nWRIT PETITION FOR ISSUANCE OF A WRIT OF MANDAMUS\n\nMost Respectfully Showeth: ...'),
('Family', 'Mutual Consent Divorce', 'Joint Petition u/s 13B HMA', 'Joint petition for divorce by mutual consent under the Hindu Marriage Act.', E'IN THE FAMILY COURT AT [CITY]\n\nH.M.A. Petition No. ____ of [YEAR]\n(Under Section 13B of the Hindu Marriage Act, 1955)\n\n1. [Husband] ... Petitioner No.1\n2. [Wife] ... Petitioner No.2\n\nJOINT PETITION FOR DISSOLUTION OF MARRIAGE BY MUTUAL CONSENT ...'),
('Notices', 'Section 138 NI Act Notice', 'Statutory Notice for Cheque Dishonour', 'Demand notice under Section 138 of the Negotiable Instruments Act for a dishonoured cheque.', E'LEGAL NOTICE\nUnder Section 138 of the Negotiable Instruments Act, 1881\n\nTo,\n[Drawer Name & Address]\n\nFrom: [Payee] through Counsel [Advocate Name]\n\nDear Sir/Madam,\n\nUnder instructions from and on behalf of my client, I hereby serve upon you the following legal notice ...'),
('Property', 'Sale Deed', 'Sale Deed for Immovable Property', 'Conveyance of immovable property for valuable consideration.', E'SALE DEED\n\nThis SALE DEED is executed on this ___ day of ___, [Year] at [City] by and between:\n\n[Vendor] ... VENDOR / SELLER\n\nAND\n\n[Vendee] ... VENDEE / PURCHASER\n\nWHEREAS the Vendor is the absolute owner of the property described in the Schedule hereunder ...'),
('Corporate', 'NDA', 'Mutual Non-Disclosure Agreement', 'Bilateral NDA between two parties exchanging confidential information.', E'MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into on [Date] by and between [Party A] and [Party B] ...');
