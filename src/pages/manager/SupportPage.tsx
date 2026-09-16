import { Link } from 'react-router-dom';
import { Scissors, Mail, Phone, HelpCircle, LifeBuoy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  'support.q1',
  'support.q2',
  'support.q3',
  'support.q4',
  'support.q5',
  'support.q6',
  'support.q7',
  'support.q8',
];

export default function SupportPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader title={t('nav.support')} description={t('support.subtitle')} icon={LifeBuoy} />

      <SectionCard title={t('nav.support')} icon={HelpCircle} bodyClassName="p-2" className="mb-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((key, i) => (
            <AccordionItem key={key} value={`item-${i}`}>
              <AccordionTrigger>{t(`support.q${i + 1}`)}</AccordionTrigger>
              <AccordionContent>{t(`support.a${i + 1}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionCard>

      <SectionCard icon={Scissors} bodyClassName="p-5">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scissors className="size-5" />
            </div>
            <div>
              <p className="font-medium">{t('support.contactTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('support.contactHint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <a href="mailto:support@barbershoppro.rw">
                <Mail className="mr-2 h-4 w-4" />
                support@barbershoppro.rw
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:+250700000000">
                <Phone className="mr-2 h-4 w-4" />
                +250 700 000 000
              </a>
            </Button>
          </div>
        </div>
      </SectionCard>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('support.barberPortalHint')}{' '}
        <Link to="/portal/login" className="font-medium text-primary hover:underline">
          {t('auth.portalLogin')}
        </Link>
      </p>
    </div>
  );
}