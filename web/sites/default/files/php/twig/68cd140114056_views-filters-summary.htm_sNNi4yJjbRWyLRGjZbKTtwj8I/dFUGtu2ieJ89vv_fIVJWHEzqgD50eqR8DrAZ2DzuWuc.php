<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\CoreExtension;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;
use Twig\TemplateWrapper;

/* modules/contrib/views_filters_summary/templates/views-filters-summary.html.twig */
class __TwigTemplate_097afd28304d8ff494e9f281aee9bd69 extends Template
{
    private Source $source;
    /**
     * @var array<string, Template>
     */
    private array $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
        $this->sandbox = $this->extensions[SandboxExtension::class];
        $this->checkSecurity();
    }

    protected function doDisplay(array $context, array $blocks = []): iterable
    {
        $macros = $this->macros;
        // line 1
        yield "
";
        // line 21
        yield "

";
        // line 23
        $context["classes"] = ["views-filters-summary", (((($tmp = CoreExtension::getAttribute($this->env, $this->source,         // line 25
($context["options"] ?? null), "use_ajax", [], "any", false, false, true, 25)) && $tmp instanceof Markup ? (string) $tmp : $tmp)) ? ("views-filters-summary--use-ajax") : (""))];
        // line 27
        yield "
";
        // line 28
        $_v0 = ('' === $tmp = \Twig\Extension\CoreExtension::captureOutput((function () use (&$context, $macros, $blocks) {
            // line 29
            yield "  <div";
            yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, ($context["attributes"] ?? null), "addClass", [($context["classes"] ?? null)], "method", false, false, true, 29), "html", null, true);
            yield " data-exposed-form-id=";
            yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, ($context["exposed_form_id"] ?? null), "html", null, true);
            yield ">
    ";
            // line 30
            if ((($context["summary"] ?? null) && CoreExtension::getAttribute($this->env, $this->source, CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "filters_summary", [], "any", false, false, true, 30), "prefix", [], "any", false, false, true, 30))) {
                // line 31
                yield "      <span class=\"prefix\">
        ";
                // line 32
                yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "filters_summary", [], "any", false, false, true, 32), "prefix", [], "any", false, false, true, 32), "html", null, true);
                yield "
      </span>
    ";
            }
            // line 35
            yield "
    <span class=\"items\">";
            // line 37
            $context['_parent'] = $context;
            $context['_seq'] = CoreExtension::ensureTraversable(($context["summary"] ?? null));
            $context['loop'] = [
              'parent' => $context['_parent'],
              'index0' => 0,
              'index'  => 1,
              'first'  => true,
            ];
            if (is_array($context['_seq']) || (is_object($context['_seq']) && $context['_seq'] instanceof \Countable)) {
                $length = count($context['_seq']);
                $context['loop']['revindex0'] = $length - 1;
                $context['loop']['revindex'] = $length;
                $context['loop']['length'] = $length;
                $context['loop']['last'] = 1 === $length;
            }
            foreach ($context['_seq'] as $context["_key"] => $context["item"]) {
                // line 38
                yield "<span class=\"item\">
          ";
                // line 39
                if ((($tmp = CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "show_label", [], "any", false, false, true, 39)) && $tmp instanceof Markup ? (string) $tmp : $tmp)) {
                    // line 40
                    yield "            <span class=\"label\">";
                    yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, $context["item"], "label", [], "any", false, false, true, 40), "html", null, true);
                    yield ":</span>
          ";
                }
                // line 42
                yield "
          ";
                // line 43
                if ((($tmp = CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "has_group_values", [], "any", false, false, true, 43)) && $tmp instanceof Markup ? (string) $tmp : $tmp)) {
                    // line 44
                    yield "            <span class=\"values\">";
                    // line 45
                    $context['_parent'] = $context;
                    $context['_seq'] = CoreExtension::ensureTraversable(CoreExtension::getAttribute($this->env, $this->source, $context["item"], "groups", [], "any", false, false, true, 45));
                    foreach ($context['_seq'] as $context["_key"] => $context["value"]) {
                        // line 46
                        yield "<span class=\"value-container\">
                  <strong class=\"value\">";
                        // line 47
                        yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, $context["value"], "value", [], "any", false, false, true, 47), "html", null, true);
                        yield "</strong>
                  ";
                        // line 48
                        if ((CoreExtension::getAttribute($this->env, $this->source, $context["value"], "link", [], "any", false, false, true, 48) && CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "show_remove_link", [], "any", false, false, true, 48))) {
                            // line 49
                            yield "                    ";
                            yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, $context["value"], "link", [], "any", false, false, true, 49), "html", null, true);
                            yield "
                  ";
                        }
                        // line 51
                        yield "                </span>
              ";
                    }
                    $_parent = $context['_parent'];
                    unset($context['_seq'], $context['_key'], $context['value'], $context['_parent']);
                    $context = array_intersect_key($context, $_parent) + $_parent;
                    // line 53
                    yield "             </span>
          ";
                } else {
                    // line 55
                    yield "            <span class=\"value-container\">
              <strong class=\"value\">";
                    // line 56
                    yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, $context["item"], "value", [], "any", false, false, true, 56), "html", null, true);
                    yield "</strong>
              ";
                    // line 57
                    if ((CoreExtension::getAttribute($this->env, $this->source, $context["item"], "link", [], "any", false, false, true, 57) && CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "show_remove_link", [], "any", false, false, true, 57))) {
                        // line 58
                        yield "                  ";
                        yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, $context["item"], "link", [], "any", false, false, true, 58), "html", null, true);
                        yield "
              ";
                    }
                    // line 60
                    yield "            </span>
          ";
                }
                // line 62
                yield "
          ";
                // line 63
                if ((CoreExtension::getAttribute($this->env, $this->source, $context["loop"], "last", [], "any", false, false, true, 63) == false)) {
                    // line 64
                    yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "filters_summary", [], "any", false, false, true, 64), "separator", [], "any", false, false, true, 64), "html", null, true);
                }
                // line 66
                yield "        </span>";
                ++$context['loop']['index0'];
                ++$context['loop']['index'];
                $context['loop']['first'] = false;
                if (isset($context['loop']['revindex0'], $context['loop']['revindex'])) {
                    --$context['loop']['revindex0'];
                    --$context['loop']['revindex'];
                    $context['loop']['last'] = 0 === $context['loop']['revindex0'];
                }
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_key'], $context['item'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 68
            yield "</span>

    ";
            // line 70
            if (((($context["summary"] ?? null) && CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "show_reset_link", [], "any", false, false, true, 70)) && CoreExtension::getAttribute($this->env, $this->source, CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "reset_link", [], "any", false, false, true, 70), "title", [], "any", false, false, true, 70))) {
                // line 71
                yield "      <a class=\"reset\" href='/'>";
                yield $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, CoreExtension::getAttribute($this->env, $this->source, CoreExtension::getAttribute($this->env, $this->source, ($context["options"] ?? null), "reset_link", [], "any", false, false, true, 71), "title", [], "any", false, false, true, 71), "html", null, true);
                yield "</a>
    ";
            }
            // line 73
            yield "  </div>
";
            yield from [];
        })())) ? '' : new Markup($tmp, $this->env->getCharset());
        // line 28
        yield $this->extensions['Drupal\Core\Template\TwigExtension']->renderVar(Twig\Extension\CoreExtension::spaceless($_v0));
        $this->env->getExtension('\Drupal\Core\Template\TwigExtension')
            ->checkDeprecations($context, ["options", "attributes", "exposed_form_id", "summary", "loop"]);        yield from [];
    }

    /**
     * @codeCoverageIgnore
     */
    public function getTemplateName(): string
    {
        return "modules/contrib/views_filters_summary/templates/views-filters-summary.html.twig";
    }

    /**
     * @codeCoverageIgnore
     */
    public function isTraitable(): bool
    {
        return false;
    }

    /**
     * @codeCoverageIgnore
     */
    public function getDebugInfo(): array
    {
        return array (  203 => 28,  198 => 73,  192 => 71,  190 => 70,  186 => 68,  172 => 66,  169 => 64,  167 => 63,  164 => 62,  160 => 60,  154 => 58,  152 => 57,  148 => 56,  145 => 55,  141 => 53,  134 => 51,  128 => 49,  126 => 48,  122 => 47,  119 => 46,  115 => 45,  113 => 44,  111 => 43,  108 => 42,  102 => 40,  100 => 39,  97 => 38,  80 => 37,  77 => 35,  71 => 32,  68 => 31,  66 => 30,  59 => 29,  57 => 28,  54 => 27,  52 => 25,  51 => 23,  47 => 21,  44 => 1,);
    }

    public function getSourceContext(): Source
    {
        return new Source("", "modules/contrib/views_filters_summary/templates/views-filters-summary.html.twig", "/var/www/drupal/web/modules/contrib/views_filters_summary/templates/views-filters-summary.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = ["set" => 23, "apply" => 28, "if" => 30, "for" => 37];
        static $filters = ["escape" => 29, "spaceless" => 28];
        static $functions = [];

        try {
            $this->sandbox->checkSecurity(
                ['set', 'apply', 'if', 'for'],
                ['escape', 'spaceless'],
                [],
                $this->source
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
